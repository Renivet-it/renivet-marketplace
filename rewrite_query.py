import re

file_path = 'c:/Personal Projects/renivet-marketplace/src/lib/db/queries/product.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

tables = [
    "homeProductSection",
    "homeProductLoveTheseSection",
    "homeProductMayAlsoLikeThese",
    "homeProductPageList",
    "homeNewArrivals",
    "womenPageFeaturedProducts",
    "menPageFeaturedProducts",
    "womenStyleWithSubstanceMiddlePageSection",
    "menCuratedHerEssence",
    "kidsFreshCollectionSection",
    "homeandlivingNewArrival",
    "homeandlivingTopPicks",
    "beautyNewArrivals",
    "beautyTopPicks",
    "newProductEventPage"
]

for table in tables:
    # Ensure we don't double add
    check_pattern = rf"db\.query\.{table}\.findMany\({{\s*where:\s*eq\({table}\.isDeleted,\s*false\),\s*orderBy:"
    if re.search(check_pattern, text):
        print(f"Already ordered: {table}")
        continue
        
    pattern = rf"(db\.query\.{table}\.findMany\({{\s*where:\s*eq\({table}\.isDeleted,\s*false\),)"
    repl = rf"\1\n            orderBy: [asc({table}.position)],"
    text, num = re.subn(pattern, repl, text)
    if num > 0:
        print(f"Injected orderBy for {table}")
    else:
        print(f"Warning: Could not match findMany for {table}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Done rewrite query!")
