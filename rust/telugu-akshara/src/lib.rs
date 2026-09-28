//! Telugu akshara tools compiled to WebAssembly.
//!
//! ABI used by lib/telugu-akshara-wasm.ts:
//!   Akshara splitting:
//!     input_ptr()      -> where JS writes UTF-8 input
//!     output_ptr()     -> where results are written
//!     input_capacity() -> max input bytes
//!     analyze(len)     -> output byte length, or u32::MAX on error
//!     Output: aksharas joined by U+001F (unit separator).
//!   Trace checking:
//!     mask_side()       -> grid side length (64)
//!     drawn_mask_ptr()  -> where JS writes the child's drawing (side*side alpha bytes)
//!     target_mask_ptr() -> where JS writes the letter shape (side*side alpha bytes)
//!     score_trace()     -> (coverage% << 8) | precision%, or u32::MAX on error

/* ================= AKSHARA SPLITTING ================= */

const INPUT_CAPACITY: usize = 8192;
const OUTPUT_CAPACITY: usize = INPUT_CAPACITY * 2;
const VIRAMA: char = '\u{0c4d}';
const ZWNJ: char = '\u{200c}';
const ZWJ: char = '\u{200d}';

static mut INPUT_BUFFER: [u8; INPUT_CAPACITY] = [0; INPUT_CAPACITY];
static mut OUTPUT_BUFFER: [u8; OUTPUT_CAPACITY] = [0; OUTPUT_CAPACITY];

fn is_telugu_mark(character: char) -> bool {
    matches!(
        character as u32,
        0x0c00..=0x0c04       // candrabindu, anusvara, visarga
            | 0x0c3c          // nukta
            | 0x0c3e..=0x0c4d // vowel signs + virama
            | 0x0c55..=0x0c56 // length marks
            | 0x0c62..=0x0c63 // vocalic L/LL signs
    )
}

fn is_telugu_consonant(character: char) -> bool {
    matches!(character as u32, 0x0c15..=0x0c39 | 0x0c58..=0x0c5a)
}

/// Characters that should never become a chip on their own.
fn is_skipped(character: char) -> bool {
    character.is_whitespace()
        || character.is_control()
        || character.is_ascii_punctuation()
        || matches!(character, '\u{0964}' | '\u{0965}' | ZWNJ | ZWJ)
}

fn split_aksharas(text: &str) -> Vec<&str> {
    let mut segments = Vec::new();
    let mut start: Option<usize> = None;
    let mut after_virama = false;

    for (index, character) in text.char_indices() {
        let joins_previous = start.is_some()
            && (is_telugu_mark(character)
                || character == ZWJ
                || (after_virama && (is_telugu_consonant(character) || character == ZWNJ)));

        if !joins_previous {
            if let Some(segment_start) = start.take() {
                segments.push(&text[segment_start..index]);
            }
            if is_skipped(character) {
                after_virama = false;
                continue;
            }
            start = Some(index);
        }

        match character {
            VIRAMA => after_virama = true,
            ZWJ => {}                  // ZWJ keeps the conjunct going
            _ => after_virama = false, // includes ZWNJ: it ends the conjunct
        }
    }

    if let Some(segment_start) = start {
        segments.push(&text[segment_start..]);
    }
    segments
}

#[unsafe(no_mangle)]
pub extern "C" fn input_ptr() -> *mut u8 {
    core::ptr::addr_of_mut!(INPUT_BUFFER).cast::<u8>()
}

#[unsafe(no_mangle)]
pub extern "C" fn output_ptr() -> *const u8 {
    core::ptr::addr_of!(OUTPUT_BUFFER).cast::<u8>()
}

#[unsafe(no_mangle)]
pub extern "C" fn input_capacity() -> u32 {
    INPUT_CAPACITY as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn analyze(input_length: u32) -> u32 {
    let input_length = input_length as usize;
    if input_length > INPUT_CAPACITY {
        return u32::MAX;
    }

    // SAFETY: wasm is single-threaded; JS writes the input and then calls
    // `analyze` synchronously, so nothing else touches these buffers.
    let input_bytes = unsafe {
        core::slice::from_raw_parts(core::ptr::addr_of!(INPUT_BUFFER).cast::<u8>(), input_length)
    };
    let output = unsafe {
        core::slice::from_raw_parts_mut(
            core::ptr::addr_of_mut!(OUTPUT_BUFFER).cast::<u8>(),
            OUTPUT_CAPACITY,
        )
    };

    let Ok(text) = core::str::from_utf8(input_bytes) else {
        return u32::MAX;
    };

    let mut output_length = 0;
    for (index, segment) in split_aksharas(text).into_iter().enumerate() {
        let needed = segment.len() + usize::from(index > 0);
        if output_length + needed > OUTPUT_CAPACITY {
            return u32::MAX;
        }
        if index > 0 {
            output[output_length] = 0x1f;
            output_length += 1;
        }
        output[output_length..output_length + segment.len()].copy_from_slice(segment.as_bytes());
        output_length += segment.len();
    }

    output_length as u32
}

/* ================= TRACE CHECKING ================= */

const MASK_SIDE: usize = 64;
const MASK_CELLS: usize = MASK_SIDE * MASK_SIDE;
/// How far (in grid cells) a stroke may be from the letter and still count.
/// 2 cells ≈ 3% of the board.
const TOLERANCE: isize = 2;
/// Alpha values at or above this count as ink (anti-aliased edges are partial).
const INK_THRESHOLD: u8 = 32;

static mut DRAWN_MASK: [u8; MASK_CELLS] = [0; MASK_CELLS];
static mut TARGET_MASK: [u8; MASK_CELLS] = [0; MASK_CELLS];

/// Marks every cell within `radius` of an inked cell.
fn dilate(mask: &[bool], side: usize, radius: isize) -> Vec<bool> {
    let mut out = vec![false; mask.len()];
    for y in 0..side {
        for x in 0..side {
            if !mask[y * side + x] {
                continue;
            }
            for dy in -radius..=radius {
                for dx in -radius..=radius {
                    let nx = x as isize + dx;
                    let ny = y as isize + dy;
                    if nx >= 0 && ny >= 0 && (nx as usize) < side && (ny as usize) < side {
                        out[ny as usize * side + nx as usize] = true;
                    }
                }
            }
        }
    }
    out
}

/// Returns (coverage %, precision %).
/// coverage  = share of the letter that has a stroke nearby
/// precision = share of the strokes that are near the letter
/// None if the sizes are wrong or the target letter is empty.
fn trace_score(drawn: &[u8], target: &[u8], side: usize) -> Option<(u8, u8)> {
    if drawn.len() != side * side || target.len() != side * side {
        return None;
    }

    let drawn: Vec<bool> = drawn.iter().map(|&v| v >= INK_THRESHOLD).collect();
    let target: Vec<bool> = target.iter().map(|&v| v >= INK_THRESHOLD).collect();

    let target_total = target.iter().filter(|&&t| t).count();
    if target_total == 0 {
        return None;
    }
    let drawn_total = drawn.iter().filter(|&&d| d).count();
    if drawn_total == 0 {
        return Some((0, 0));
    }

    let drawn_near = dilate(&drawn, side, TOLERANCE);
    let target_near = dilate(&target, side, TOLERANCE);

    let covered = target.iter().zip(&drawn_near).filter(|(t, d)| **t && **d).count();
    let precise = drawn.iter().zip(&target_near).filter(|(d, t)| **d && **t).count();

    Some((
        (covered * 100 / target_total) as u8,
        (precise * 100 / drawn_total) as u8,
    ))
}

#[unsafe(no_mangle)]
pub extern "C" fn mask_side() -> u32 {
    MASK_SIDE as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn drawn_mask_ptr() -> *mut u8 {
    core::ptr::addr_of_mut!(DRAWN_MASK).cast::<u8>()
}

#[unsafe(no_mangle)]
pub extern "C" fn target_mask_ptr() -> *mut u8 {
    core::ptr::addr_of_mut!(TARGET_MASK).cast::<u8>()
}

#[unsafe(no_mangle)]
pub extern "C" fn score_trace() -> u32 {
    // SAFETY: same single-threaded reasoning as `analyze`.
    let drawn = unsafe {
        core::slice::from_raw_parts(core::ptr::addr_of!(DRAWN_MASK).cast::<u8>(), MASK_CELLS)
    };
    let target = unsafe {
        core::slice::from_raw_parts(core::ptr::addr_of!(TARGET_MASK).cast::<u8>(), MASK_CELLS)
    };

    match trace_score(drawn, target, MASK_SIDE) {
        Some((coverage, precision)) => (u32::from(coverage) << 8) | u32::from(precision),
        None => u32::MAX,
    }
}

/* ================= TESTS ================= */

#[cfg(test)]
mod tests {
    use super::{split_aksharas, trace_score};

    // ---- akshara splitting ----

    #[test]
    fn splits_telugu_word_into_aksharas() {
        assert_eq!(split_aksharas("ఎలుక"), ["ఎ", "లు", "క"]);
        assert_eq!(split_aksharas("తెలుగు"), ["తె", "లు", "గు"]);
    }

    #[test]
    fn keeps_conjunct_consonants_together() {
        assert_eq!(split_aksharas("కృష్ణ"), ["కృ", "ష్ణ"]);
        assert_eq!(split_aksharas("లక్ష్మి"), ["ల", "క్ష్మి"]);
        assert_eq!(split_aksharas("స్త్రీ"), ["స్త్రీ"]);
    }

    #[test]
    fn anusvara_stays_with_its_letter() {
        assert_eq!(split_aksharas("సంతోషం"), ["సం", "తో", "షం"]);
    }

    #[test]
    fn skips_punctuation_and_spaces() {
        assert_eq!(split_aksharas("అమ్మ! బాగుంది"), ["అ", "మ్మ", "బా", "గుం", "ది"]);
        assert!(split_aksharas("  !! ").is_empty());
    }

    #[test]
    fn skips_control_characters() {
        assert_eq!(split_aksharas("అ\u{1f}మ\tక"), ["అ", "మ", "క"]);
    }

    #[test]
    fn zwnj_breaks_conjunct() {
        assert_eq!(split_aksharas("క్\u{200c}ష"), ["క్\u{200c}", "ష"]);
    }

    // ---- trace checking ----

    const SIDE: usize = 64;

    fn rect(x0: usize, y0: usize, x1: usize, y1: usize) -> Vec<u8> {
        let mut mask = vec![0u8; SIDE * SIDE];
        for y in y0..y1 {
            for x in x0..x1 {
                mask[y * SIDE + x] = 255;
            }
        }
        mask
    }

    #[test]
    fn perfect_trace_scores_full() {
        let target = rect(20, 20, 40, 40);
        assert_eq!(trace_score(&target, &target, SIDE), Some((100, 100)));
    }

    #[test]
    fn slightly_offset_trace_is_tolerated() {
        let target = rect(20, 20, 40, 40);
        let drawn = rect(21, 21, 41, 41);
        assert_eq!(trace_score(&drawn, &target, SIDE), Some((100, 100)));
    }

    #[test]
    fn empty_drawing_scores_zero() {
        let target = rect(20, 20, 40, 40);
        assert_eq!(trace_score(&vec![0; SIDE * SIDE], &target, SIDE), Some((0, 0)));
    }

    #[test]
    fn far_away_drawing_scores_zero() {
        let target = rect(40, 40, 60, 60);
        let drawn = rect(0, 0, 10, 10);
        assert_eq!(trace_score(&drawn, &target, SIDE), Some((0, 0)));
    }

    #[test]
    fn scribbling_everywhere_has_low_precision() {
        let target = rect(20, 20, 40, 40);
        let drawn = rect(0, 0, SIDE, SIDE);
        let (coverage, precision) = trace_score(&drawn, &target, SIDE).unwrap();
        assert_eq!(coverage, 100);
        assert!(precision < 50);
    }

    #[test]
    fn empty_target_is_an_error() {
        let drawn = rect(20, 20, 40, 40);
        assert_eq!(trace_score(&drawn, &vec![0; SIDE * SIDE], SIDE), None);
    }

    #[test]
    fn wrong_size_is_an_error() {
        assert_eq!(trace_score(&[0; 10], &[0; 10], SIDE), None);
    }
}