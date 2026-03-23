const fs = require('fs');
const file = 'c:/Personal Projects/renivet-marketplace/src/components/dashboard/general/products/product-admin-action.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
    /} from "@\/actions\/product-action";/,
    `    updateSectionPosition,
    type ProductSectionKey,
} from "@/actions/product-action";`
);

content = content.replace(
    /import { Button } from "@\/components\/ui\/button-dash";/,
    `import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`
);

// 2. Add SectionPositionToggle component before ProductAction
const toggleComponent = `
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
                <span>{isActive ? \`Edit / Remove from \${label}\` : \`Add to \${label}\`}{(extraSuffix ? \` \${extraSuffix}\` : "")}</span>
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

export function ProductAction({ product }: PageProps) {`;

content = content.replace(/export function ProductAction\(\{\s*product\s*\}\:\s*PageProps\)\s*\{/, toggleComponent);

// 3. Add handleUpdatePosition handler inside ProductAction
const updateHandler = `
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
`;
content = content.replace(/(const { refetch } = trpc.*?\}\);)/s, '$1' + updateHandler);

// 4. Update the toggle handlers to accept (position?: number)
const handlerNames = [
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
    'handleToggleSummerCollection',
    'handlenewEventPageSectionProduct'
];

for (const hn of handlerNames) {
    if (hn === 'handletoggleHomeAndLivingNewArrivalsSection') {
        content = content.replace(/const handletoggleHomeAndLivingNewArrivalsSection = async \(\) => \{/, 'const handletoggleHomeAndLivingNewArrivalsSection = async (position?: number) => {');
    } else {
        const regex = new RegExp('const ' + hn + ' = async \\(\\)(.*?)=>\\s*\\{', 'gs');
        content = content.replace(regex, 'const ' + hn + ' = async (position?: number)$1=> {');
    }
}

// 5. Update the action calls to pass position
content = content.replace(/await toggleBestSeller\(product\.id\)/g, 'await toggleBestSeller(product.id, position)');
content = content.replace(/await toggleUnder999\([\s\S]*?product\.isUnder999 \?\? false\s*\)/g, 'await toggleUnder999(product.id, product.isUnder999 ?? false, position)');
content = content.replace(/await toggleFeaturedProduct\([\s\S]*?product\.isFeaturedWomen \?\? false\s*\)/g, 'await toggleFeaturedProduct(product.id, product.isFeaturedWomen ?? false, position)');
content = content.replace(/await menToggleFeaturedProduct\([\s\S]*?product\.isFeaturedMen \?\? false\s*\)/g, 'await menToggleFeaturedProduct(product.id, product.isFeaturedMen ?? false, position)');
content = content.replace(/await toggleWomenStyleWithSubstance\([\s\S]*?product\.isStyleWithSubstanceWoMen \?\? false\s*\)/g, 'await toggleWomenStyleWithSubstance(product.id, product.isStyleWithSubstanceWoMen ?? false, position)');
content = content.replace(/await toggleHomeHeroProduct\([\s\S]*?product\.isHomeHeroProducts \?\? false\s*\)/g, 'await toggleHomeHeroProduct(product.id, product.isHomeHeroProducts ?? false, position)');
content = content.replace(/await toggleHomeYouMayLoveProduct\([\s\S]*?product\.isHomeLoveTheseProducts \?\? false\s*\)/g, 'await toggleHomeYouMayLoveProduct(product.id, product.isHomeLoveTheseProducts ?? false, position)');
content = content.replace(/await toggleHomeYouMayAlsoLikeProduct\([\s\S]*?product\.isHomeYouMayAlsoLikeTheseProducts \?\? false\s*\)/g, 'await toggleHomeYouMayAlsoLikeProduct(product.id, product.isHomeYouMayAlsoLikeTheseProducts ?? false, position)');
content = content.replace(/await toggleHomePageProduct\([\s\S]*?product\.isHomePageProduct \?\? false\s*\)/g, 'await toggleHomePageProduct(product.id, product.isHomePageProduct ?? false, position)');
content = content.replace(/await toggleMenStyleWithSubstance\([\s\S]*?product\.isStyleWithSubstanceMen \?\? false\s*\)/g, 'await toggleMenStyleWithSubstance(product.id, product.isStyleWithSubstanceMen ?? false, position)');
content = content.replace(/await toggleKidsFetchSection\([\s\S]*?product\.iskidsFetchSection \?\? false\s*\)/g, 'await toggleKidsFetchSection(product.id, product.iskidsFetchSection ?? false, position)');
content = content.replace(/await toggleHomeAndLivingNewArrivalsSection\([\s\S]*?product\.isHomeAndLivingSectionNewArrival \?\? false\s*\)/g, 'await toggleHomeAndLivingNewArrivalsSection(product.id, product.isHomeAndLivingSectionNewArrival ?? false, position)');
content = content.replace(/await toggleHomeAndLivingTopPicksSection\([\s\S]*?product\.isHomeAndLivingSectionTopPicks \?\? false\s*\)/g, 'await toggleHomeAndLivingTopPicksSection(product.id, product.isHomeAndLivingSectionTopPicks ?? false, position)');
content = content.replace(/await toggleBeautyNewArrivalSection\([\s\S]*?product\.isBeautyNewArrival \?\? false\s*\)/g, 'await toggleBeautyNewArrivalSection(product.id, product.isBeautyNewArrival ?? false, position)');
content = content.replace(/await toggleBeautyTopPickSection\([\s\S]*?product\.isBeautyTopPicks \?\? false\s*\)/g, 'await toggleBeautyTopPickSection(product.id, product.isBeautyTopPicks ?? false, position)');
content = content.replace(/await newEventPageSection\([\s\S]*?product\.isAddedInEventProductPage \?\? false\s*\)/g, 'await newEventPageSection(product.id, product.isAddedInEventProductPage ?? false, position)');

// 6. Replace dropdown items
// We use normal regex syntax without double escaping:
const replaces = [
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleBestSeller\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Star className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Best Sellers"
                            icon={Icons.Star}
                            isActive={product.isBestSeller ?? false}
                            isLoading={isLoading}
                            sectionKey="bestSeller"
                            onToggle={handleToggleBestSeller}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleUnder999\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.DollarSign className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Under 999 section"
                            icon={Icons.DollarSign}
                            isActive={product.isUnder999 ?? false}
                            isLoading={isLoading}
                            sectionKey="under999"
                            onToggle={handleToggleUnder999}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleFeatured\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Star className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Featured Women"
                            icon={Icons.Star}
                            isActive={product.isFeaturedWomen ?? false}
                            isLoading={isLoading}
                            sectionKey="featuredWomen"
                            onToggle={handleToggleFeatured}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleProductHeroHomePage\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Star className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Hero Home Page"
                            icon={Icons.Star}
                            isActive={product.isHomeHeroProducts ?? false}
                            isLoading={isLoading}
                            sectionKey="homeHero"
                            onToggle={handleToggleProductHeroHomePage}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleYouMayLoveThese\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Star className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="You may love these products Home Page"
                            icon={Icons.Star}
                            isActive={product.isHomeLoveTheseProducts ?? false}
                            isLoading={isLoading}
                            sectionKey="homeLoveThese"
                            onToggle={handleToggleYouMayLoveThese}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleYouMayAlsoLikeThese\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Star className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="You may also like these products Home Page"
                            icon={Icons.Star}
                            isActive={product.isHomeYouMayAlsoLikeTheseProducts ?? false}
                            isLoading={isLoading}
                            sectionKey="homeMayAlsoLike"
                            onToggle={handleToggleYouMayAlsoLikeThese}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleHomePageMainProduct\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Star className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="bottom products Home Page"
                            icon={Icons.Star}
                            isActive={product.isHomePageProduct ?? false}
                            isLoading={isLoading}
                            sectionKey="homePageList"
                            onToggle={handleToggleHomePageMainProduct}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleFeaturedMen\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Star className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Featured Men"
                            icon={Icons.Star}
                            isActive={product.isFeaturedMen ?? false}
                            isLoading={isLoading}
                            sectionKey="featuredMen"
                            onToggle={handleToggleFeaturedMen}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleWomenStyleWithSubstance\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Layers className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Style With Substance (Women)"
                            icon={Icons.Layers}
                            isActive={product.isStyleWithSubstanceWoMen ?? false}
                            isLoading={isLoading}
                            sectionKey="styleWithSubstanceWomen"
                            onToggle={handleToggleWomenStyleWithSubstance}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleMenStyleWithSubstance\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Layers className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Style With Substance (Men)"
                            icon={Icons.Layers}
                            isActive={product.isStyleWithSubstanceMen ?? false}
                            isLoading={isLoading}
                            sectionKey="styleWithSubstanceMen"
                            onToggle={handleToggleMenStyleWithSubstance}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handleToggleKidsFetchProducts\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Layers className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Product Feature (Kids)"
                            icon={Icons.Layers}
                            isActive={product.iskidsFetchSection ?? false}
                            isLoading={isLoading}
                            sectionKey="kidsFetch"
                            onToggle={handleToggleKidsFetchProducts}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem[\s\n\r]+onClick=\{\s*handletoggleHomeAndLivingNewArrivalsSection\s*\}[\s\n\r]+disabled=\{isLoading\}[\s\n\r]*>[\s\n\r]*<Icons\.Layers className="size-4" \/>[\s\n\r]*<span>[\s\S]*?<\/span>[\s\n\r]*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="New Arrivals (Home living)"
                            icon={Icons.Layers}
                            isActive={product.isHomeAndLivingSectionNewArrival ?? false}
                            isLoading={isLoading}
                            sectionKey="homeLivingNewArrival"
                            onToggle={handletoggleHomeAndLivingNewArrivalsSection}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handletoggleHomeAndLivingTopPicksSection\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Layers className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Top Picks(Home living)"
                            icon={Icons.Layers}
                            isActive={product.isHomeAndLivingSectionTopPicks ?? false}
                            isLoading={isLoading}
                            sectionKey="homeLivingTopPicks"
                            onToggle={handletoggleHomeAndLivingTopPicksSection}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handletoggleBeautyNewArrivalSection\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Layers className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="New Arrivals(Beauty Personal)"
                            icon={Icons.Layers}
                            isActive={product.isBeautyNewArrival ?? false}
                            isLoading={isLoading}
                            sectionKey="beautyNewArrivals"
                            onToggle={handletoggleBeautyNewArrivalSection}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handletoggleBeautyTopPickSection\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Layers className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Top Picks(Beauty Personal)"
                            icon={Icons.Layers}
                            isActive={product.isBeautyTopPicks ?? false}
                            isLoading={isLoading}
                            sectionKey="beautyTopPicks"
                            onToggle={handletoggleBeautyTopPickSection}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    },
    {
        pattern: /<DropdownMenuItem\s+onClick=\{handlenewEventPageSectionProduct\}\s+disabled=\{isLoading\}\s*>\s*<Icons\.Layers className="size-4" \/>\s*<span>[\s\S]*?<\/span>\s*<\/DropdownMenuItem>/g,
        replacement: \`<SectionPositionToggle
                            label="Event Exibition Page"
                            icon={Icons.Layers}
                            isActive={product.isAddedInEventProductPage ?? false}
                            isLoading={isLoading}
                            sectionKey="eventPage"
                            onToggle={handlenewEventPageSectionProduct}
                            onUpdatePosition={handleUpdatePosition}
                        />\`
    }
];

for (const r of replaces) {
    const matched = content.match(r.pattern);
    if (!matched) {
        console.log("Could not find match for pattern:", String(r.pattern).slice(0, 30));
    }
    content = content.replace(r.pattern, r.replacement);
}

fs.writeFileSync(file, content, 'utf8');
console.log("Done rewriting!");
