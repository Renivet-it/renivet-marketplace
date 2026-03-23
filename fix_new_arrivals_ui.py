import re

file_path = 'c:/Personal Projects/renivet-marketplace/src/components/dashboard/general/products/product-admin-action.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add state variable
state_pattern = r"(const \[isLoading, setIsLoading\] = useState\(false\);)"
text = re.sub(state_pattern, r"\1\n    const [newArrivalsPos, setNewArrivalsPos] = useState<number>(1);", text, count=1)

# 2. Update handletoggleHomeNewArrivalsProduct signature
handler_pattern = r"(const handletoggleHomeNewArrivalsProduct = async \([\s\S]*?category: string,[\s\S]*?isActive: boolean[\s\S]*?\) => \{[\s\S]*?try \{[\s\S]*?const result = await toggleHomeNewArrivalsProduct\([\s\S]*?product\.id,[\s\S]*?isActive,[\s\S]*?category[\s\S]*?\);)"

handler_repl = r"""const handletoggleHomeNewArrivalsProduct = async (
        category: string,
        isActive: boolean,
        position?: number
    ) => {
        setIsLoading(true);

        try {
            const result = await toggleHomeNewArrivalsProduct(
                product.id,
                isActive,
                category,
                position
            );"""

text = re.sub(handler_pattern, handler_repl, text, count=1)

# 3. Update the JSX for New Arrivals (Home Page)
jsx_pattern = r"(<DropdownMenuSub>[\s\n\r]*<DropdownMenuSubTrigger disabled=\{isLoading\}>[\s\n\r]*<Icons\.Layers className=\"mr-2 size-4\" \/>[\s\n\r]*<span>New Arrivals \(Home Page\)<\/span>[\s\n\r]*<\/DropdownMenuSubTrigger>[\s\n\r]*<DropdownMenuPortal>[\s\n\r]*<DropdownMenuSubContent>)([\s\S]*?<DropdownMenuLabel>[\s\S]*?Select a Category[\s\S]*?<\/DropdownMenuLabel>)"

jsx_repl = r"""\1
                                    <div className="flex flex-col gap-3 p-2 pb-0">
                                        <Label className="text-xs font-semibold text-muted-foreground">Sequence Position</Label>
                                        <Input type="number" min={1} value={newArrivalsPos} onChange={e => setNewArrivalsPos(Number(e.target.value))} className="h-8" />
                                    </div>\2"""

text = re.sub(jsx_pattern, jsx_repl, text, count=1)

# 4. Update the onClick for category maps to pass position
map_pattern = r"(handletoggleHomeNewArrivalsProduct\([\s\n\r]*category,[\s\n\r]*true[\s\n\r]*\) \/\/ âœ… add \(isActive = true\))"
map_repl = r"handletoggleHomeNewArrivalsProduct(category, true, newArrivalsPos)"

text = re.sub(map_pattern, map_repl, text)

# Remove the red remove option? Wait, if there's a problem with encoding, I will just rewrite it using normal replacements.
remove_pattern = r"(handletoggleHomeNewArrivalsProduct\([\s\S]*?product\.homeNewArrivalCategory \?\?[\s\S]*?\"\",[\s\S]*?false \/\/ âœ… remove \(isActive = false\)[\s\S]*?\))"
remove_repl = r"handletoggleHomeNewArrivalsProduct(product.homeNewArrivalCategory ?? \"\", false)"
text = re.sub(remove_pattern, remove_repl, text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated product-admin-action.tsx!")
