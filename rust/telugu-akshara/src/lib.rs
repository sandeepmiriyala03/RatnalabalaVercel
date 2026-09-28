const INPUT_CAPACITY: usize = 8192;
const OUTPUT_CAPACITY: usize = INPUT_CAPACITY * 2;
const VIRAMA: char = '\u{0c4d}';

static mut INPUT_BUFFER: [u8; INPUT_CAPACITY] = [0; INPUT_CAPACITY];
static mut OUTPUT_BUFFER: [u8; OUTPUT_CAPACITY] = [0; OUTPUT_CAPACITY];

fn is_telugu_mark(character: char) -> bool {
    matches!(character as u32, 0x0c01..=0x0c03 | 0x0c3e..=0x0c4d | 0x0c55..=0x0c56 | 0x200c..=0x200d)
}

fn is_telugu_consonant(character: char) -> bool {
    matches!(character as u32, 0x0c15..=0x0c39 | 0x0c58..=0x0c5a)
}

fn split_aksharas(text: &str) -> Vec<&str> {
    let mut segments = Vec::new();
    let mut start = 0;
    let mut after_virama = false;

    for (index, character) in text.char_indices() {
        if index == 0 {
            after_virama = character == VIRAMA;
            continue;
        }

        let joins_previous = is_telugu_mark(character)
            || (after_virama && is_telugu_consonant(character));
        if !joins_previous {
            segments.push(&text[start..index]);
            start = index;
        }

        if character == VIRAMA {
            after_virama = true;
        } else if !matches!(character as u32, 0x200c..=0x200d) {
            after_virama = false;
        }
    }

    if !text.is_empty() {
        segments.push(&text[start..]);
    }
    segments
}

#[no_mangle]
pub extern "C" fn input_ptr() -> *mut u8 {
    core::ptr::addr_of_mut!(INPUT_BUFFER).cast::<u8>()
}

#[no_mangle]
pub extern "C" fn output_ptr() -> *const u8 {
    core::ptr::addr_of!(OUTPUT_BUFFER).cast::<u8>()
}

#[no_mangle]
pub extern "C" fn analyze(input_length: u32) -> u32 {
    let input_pointer = core::ptr::addr_of!(INPUT_BUFFER).cast::<u8>();
    let input_length = input_length as usize;
    if input_length > INPUT_CAPACITY {
        return u32::MAX;
    }

    let input_bytes = unsafe { core::slice::from_raw_parts(input_pointer, input_length) };
    let Ok(text) = core::str::from_utf8(input_bytes) else {
        return u32::MAX;
    };

    let output_pointer = core::ptr::addr_of_mut!(OUTPUT_BUFFER).cast::<u8>();
    let mut output_length = 0;
    for (index, segment) in split_aksharas(text).into_iter().enumerate() {
        if index > 0 {
            unsafe { output_pointer.add(output_length).write(0x1f) };
            output_length += 1;
        }
        unsafe {
            core::ptr::copy_nonoverlapping(
                segment.as_ptr(),
                output_pointer.add(output_length),
                segment.len(),
            );
        }
        output_length += segment.len();
    }

    output_length as u32
}

#[cfg(test)]
mod tests {
    use super::split_aksharas;

    #[test]
    fn splits_telugu_word_into_aksharas() {
        assert_eq!(split_aksharas("ఎలుక"), ["ఎ", "లు", "క"]);
        assert_eq!(split_aksharas("తెలుగు"), ["తె", "లు", "గు"]);
    }

    #[test]
    fn keeps_conjunct_consonants_together() {
        assert_eq!(split_aksharas("కృష్ణ"), ["కృ", "ష్ణ"]);
    }

    #[test]
    fn keeps_punctuation_and_spaces() {
        assert_eq!(split_aksharas("అమ్మ! బాగుంది"), ["అ", "మ్మ", "!", " ", "బా", "గు", "ం", "ది"]);
    }
}