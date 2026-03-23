import re

file_path = 'c:/Personal Projects/renivet-marketplace/src/components/dashboard/general/products/product-admin-action.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Imports
text = re.sub(
    r'\} from "@/actions/product-action";',
    r'    updateSectionPosition,\n    type ProductSectionKey,\n} from "@/actions/product-action";',
    text,
    count=1
)

text = re.sub(
    r'import \{ Button \} from "@/components/ui/button-dash";',
    r'import { Button } from "@/components/ui/button-dash";\nimport { Input } from "@/components/ui/input";\nimport { Label } from "@/components/ui/label";',
    text,
    count=1
)

# 2. SectionPositionToggle
toggle_component = """
function SectionPositionToggle({
    label,
    icon: Icon,
    isActive,
    isLoading,
    sectionKey,
    onToggle,
    onUpdatePosition,
    extraSuffix,
}: {
    label: string;
    icon: any;
    isActive: boolean;
    isLoading: boolean;
    sectionKey: ProductSectionKey;
    onToggle: (position?: number) => Promise<void>;
    onUpdatePosition: (section: ProductSectionKey, position: number) => Promise<void>;
    extraSuffix?: string;
}) {
    const [pos, setPos] = useState<number>(1);
    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={isLoading}>
                <Icon className="mr-2 size-4" />
                <span>{isActive ? `Edit / Remove from ${label}` : `Add to ${label}`}{(extraSuffix ? ` ${extraSuffix}` : "")}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-56 p-2">
                    {isActive ? (
                        <div className="flex flex-col gap-3">
                            <Label className="text-xs font-semibold text-muted-foreground">Update Sequence</Label>
                            <div className="flex items-center gap-2">
                                <Input type="number" min={1} value={pos} onChange={e => setPos(Number(e.target.value))} className="h-8" />
                                <Button size="sm" disabled={isLoading} onClick={() => onUpdatePosition(sectionKey, pos)}>Update</Button>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={isLoading} onClick={() => onToggle()} className="text-red-500 focus:text-red-500 justify-center cursor-pointer">
                                Remove from section
                            </DropdownMenuItem>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <Label className="text-xs font-semibold text-muted-foreground">Select Sequence Position</Label>
                            <div className="flex items-center gap-2">
                                <Input type="number" min={1} value={pos} onChange={e => setPos(Number(e.target.value))} className="h-8" />
                                <Button size="sm" disabled={isLoading} onClick={() => onToggle(pos)}>Confirm Add</Button>
                            </div>
                        </div>
                    )}
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
}

export function ProductAction({ product }: PageProps) {"""

text = re.sub(
    r'export function ProductAction\(\{\s*product\s*\}\:\s*PageProps\)\s*\{',
    toggle_component,
    text,
    count=1
)

# 3. Handle Update Position inside ProductAction
update_handler = """
    const handleUpdatePosition = async (section: ProductSectionKey, position: number) => {
        setIsLoading(true);
        try {
            const result = await updateSectionPosition(product.id, section, position);
            if (result.success) {
                refetch();
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update position");
        } finally {
            setIsLoading(false);
        }
    };
"""
text = re.sub(
    r'(const \{ refetch \} = trpc.*?\}\);)',
    r'\1' + update_handler,
    text,
    flags=re.DOTALL,
    count=1
)

# 4. Update handlers
handlers = [
    'handleToggleBestSeller',
    'handleToggleUnder999',
    'handleToggleFeatured',
    'handleToggleFeaturedMen',
    'handleToggleWomenStyleWithSubstance',
    'handleToggleProductHeroHomePage',
    'handleToggleYouMayLoveThese',
    'handleToggleYouMayAlsoLikeThese',
    'handleToggleHomePageMainProduct',
    'handleToggleMenStyleWithSubstance',
    'handleToggleKidsFetchProducts',
    'handletoggleHomeAndLivingNewArrivalsSection',
    'handletoggleHomeAndLivingTopPicksSection',
    'handletoggleBeautyNewArrivalSection',
    'handletoggleBeautyTopPickSection',
    'handlenewEventPageSectionProduct'
]

for handler in handlers:
    text = re.sub(
        rf'const {handler} = async \(\)(.*?)=>\s*{{',
        f'const {handler} = async (position?: number)\\1=> {{',
        text,
        flags=re.DOTALL
    )

# 5. Change server action calls
action_maps = [
    ('toggleBestSeller(product.id)', 'toggleBestSeller(product.id, position)'),
    ('toggleUnder999(product.id, product.isUnder999 ?? false)', 'toggleUnder999(product.id, product.isUnder999 ?? false, position)'),
    ('toggleFeaturedProduct(product.id, product.isFeaturedWomen ?? false)', 'toggleFeaturedProduct(product.id, product.isFeaturedWomen ?? false, position)'),
    ('menToggleFeaturedProduct(product.id, product.isFeaturedMen ?? false)', 'menToggleFeaturedProduct(product.id, product.isFeaturedMen ?? false, position)'),
    ('toggleWomenStyleWithSubstance(product.id, product.isStyleWithSubstanceWoMen ?? false)', 'toggleWomenStyleWithSubstance(product.id, product.isStyleWithSubstanceWoMen ?? false, position)'),
    ('toggleHomeHeroProduct(product.id, product.isHomeHeroProducts ?? false)', 'toggleHomeHeroProduct(product.id, product.isHomeHeroProducts ?? false, position)'),
    ('toggleHomeYouMayLoveProduct(product.id, product.isHomeLoveTheseProducts ?? false)', 'toggleHomeYouMayLoveProduct(product.id, product.isHomeLoveTheseProducts ?? false, position)'),
    ('toggleHomeYouMayAlsoLikeProduct(product.id, product.isHomeYouMayAlsoLikeTheseProducts ?? false)', 'toggleHomeYouMayAlsoLikeProduct(product.id, product.isHomeYouMayAlsoLikeTheseProducts ?? false, position)'),
    ('toggleHomePageProduct(product.id, product.isHomePageProduct ?? false)', 'toggleHomePageProduct(product.id, product.isHomePageProduct ?? false, position)'),
    ('toggleMenStyleWithSubstance(product.id, product.isStyleWithSubstanceMen ?? false)', 'toggleMenStyleWithSubstance(product.id, product.isStyleWithSubstanceMen ?? false, position)'),
    ('toggleKidsFetchSection(product.id, product.iskidsFetchSection ?? false)', 'toggleKidsFetchSection(product.id, product.iskidsFetchSection ?? false, position)'),
    ('toggleHomeAndLivingNewArrivalsSection(product.id, product.isHomeAndLivingSectionNewArrival ?? false)', 'toggleHomeAndLivingNewArrivalsSection(product.id, product.isHomeAndLivingSectionNewArrival ?? false, position)'),
    ('toggleHomeAndLivingTopPicksSection(product.id, product.isHomeAndLivingSectionTopPicks ?? false)', 'toggleHomeAndLivingTopPicksSection(product.id, product.isHomeAndLivingSectionTopPicks ?? false, position)'),
    ('toggleBeautyNewArrivalSection(product.id, product.isBeautyNewArrival ?? false)', 'toggleBeautyNewArrivalSection(product.id, product.isBeautyNewArrival ?? false, position)'),
    ('toggleBeautyTopPickSection(product.id, product.isBeautyTopPicks ?? false)', 'toggleBeautyTopPickSection(product.id, product.isBeautyTopPicks ?? false, position)'),
    ('newEventPageSection(product.id, product.isAddedInEventProductPage ?? false)', 'newEventPageSection(product.id, product.isAddedInEventProductPage ?? false, position)'),
]
for old_call, new_call in action_maps:
    # Need to match exactly or using a flexible regex to avoid multiline formatting issues
    escaped_old_call = re.escape(old_call).replace(r'\ ', r'\s*').replace(r'\n', r'\s*')
    text = re.sub(escaped_old_call, new_call, text)

# 6. Replace dropdown menu items with SectionPositionToggle
dropdown_replaces = [
    (r'<DropdownMenuItem\s+onClick=\{handleToggleBestSeller\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Best Sellers" icon={Icons.Star} isActive={product.isBestSeller ?? false} isLoading={isLoading} sectionKey="bestSeller" onToggle={handleToggleBestSeller} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handleToggleUnder999\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Under 999 section" icon={Icons.DollarSign} isActive={product.isUnder999 ?? false} isLoading={isLoading} sectionKey="under999" onToggle={handleToggleUnder999} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handleToggleFeatured\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Featured Women" icon={Icons.Star} isActive={product.isFeaturedWomen ?? false} isLoading={isLoading} sectionKey="featuredWomen" onToggle={handleToggleFeatured} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handleToggleProductHeroHomePage\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Hero Home Page" icon={Icons.Star} isActive={product.isHomeHeroProducts ?? false} isLoading={isLoading} sectionKey="homeHero" onToggle={handleToggleProductHeroHomePage} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handleToggleYouMayLoveThese\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="You may love these products Home Page" icon={Icons.Star} isActive={product.isHomeLoveTheseProducts ?? false} isLoading={isLoading} sectionKey="homeLoveThese" onToggle={handleToggleYouMayLoveThese} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handleToggleYouMayAlsoLikeThese\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="You may also like these products Home Page" icon={Icons.Star} isActive={product.isHomeYouMayAlsoLikeTheseProducts ?? false} isLoading={isLoading} sectionKey="homeMayAlsoLike" onToggle={handleToggleYouMayAlsoLikeThese} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handleToggleHomePageMainProduct\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="bottom products Home Page" icon={Icons.Star} isActive={product.isHomePageProduct ?? false} isLoading={isLoading} sectionKey="homePageList" onToggle={handleToggleHomePageMainProduct} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handleToggleFeaturedMen\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Featured Men" icon={Icons.Star} isActive={product.isFeaturedMen ?? false} isLoading={isLoading} sectionKey="featuredMen" onToggle={handleToggleFeaturedMen} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handleToggleWomenStyleWithSubstance\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Style With Substance (Women)" icon={Icons.Layers} isActive={product.isStyleWithSubstanceWoMen ?? false} isLoading={isLoading} sectionKey="styleWithSubstanceWomen" onToggle={handleToggleWomenStyleWithSubstance} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handleToggleMenStyleWithSubstance\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Style With Substance (Men)" icon={Icons.Layers} isActive={product.isStyleWithSubstanceMen ?? false} isLoading={isLoading} sectionKey="styleWithSubstanceMen" onToggle={handleToggleMenStyleWithSubstance} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handleToggleKidsFetchProducts\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Product Feature (Kids)" icon={Icons.Layers} isActive={product.iskidsFetchSection ?? false} isLoading={isLoading} sectionKey="kidsFetch" onToggle={handleToggleKidsFetchProducts} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handletoggleHomeAndLivingNewArrivalsSection\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="New Arrivals (Home living)" icon={Icons.Layers} isActive={product.isHomeAndLivingSectionNewArrival ?? false} isLoading={isLoading} sectionKey="homeLivingNewArrival" onToggle={handletoggleHomeAndLivingNewArrivalsSection} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handletoggleHomeAndLivingTopPicksSection\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Top Picks(Home living)" icon={Icons.Layers} isActive={product.isHomeAndLivingSectionTopPicks ?? false} isLoading={isLoading} sectionKey="homeLivingTopPicks" onToggle={handletoggleHomeAndLivingTopPicksSection} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handletoggleBeautyNewArrivalSection\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="New Arrivals(Beauty Personal)" icon={Icons.Layers} isActive={product.isBeautyNewArrival ?? false} isLoading={isLoading} sectionKey="beautyNewArrivals" onToggle={handletoggleBeautyNewArrivalSection} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handletoggleBeautyTopPickSection\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Top Picks(Beauty Personal)" icon={Icons.Layers} isActive={product.isBeautyTopPicks ?? false} isLoading={isLoading} sectionKey="beautyTopPicks" onToggle={handletoggleBeautyTopPickSection} onUpdatePosition={handleUpdatePosition} />'),
     
    (r'<DropdownMenuItem\s+onClick=\{handlenewEventPageSectionProduct\}[^>]*>[\s\S]*?<\/DropdownMenuItem>',
     r'<SectionPositionToggle label="Event Exibition Page" icon={Icons.Layers} isActive={product.isAddedInEventProductPage ?? false} isLoading={isLoading} sectionKey="eventPage" onToggle={handlenewEventPageSectionProduct} onUpdatePosition={handleUpdatePosition} />'),
]

for pat, repl in dropdown_replaces:
    text, num = re.subn(pat, repl, text)
    if num == 0:
        print(f"Warning: Did not match {pat}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print(f"Updated product-admin-action.tsx successfully.")
