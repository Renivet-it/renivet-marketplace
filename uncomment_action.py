import re

file_path = 'c:/Personal Projects/renivet-marketplace/src/actions/product-action.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# The user commented out the whole function: // export async function toggleHomeNewArrivalsProduct(...
# We can find the block and remove the leading `// `
pattern = r"(\/\/ export async function toggleHomeNewArrivalsProduct\([\s\S]*?\/\/ \})"

def uncomment(match):
    block = match.group(1)
    # Remove '// ' or '//' at the beginning of each line in the block
    uncommented = re.sub(r'^// ?', '', block, flags=re.MULTILINE)
    return uncommented

if re.search(pattern, text):
    text = re.sub(pattern, uncomment, text)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Uncommented toggleHomeNewArrivalsProduct!")
else:
    print("Could not find commented block!")

