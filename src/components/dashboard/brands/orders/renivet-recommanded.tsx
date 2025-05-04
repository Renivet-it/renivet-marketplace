import { Button } from "@/components/ui/button-general";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";

interface PageProps {
    isRenivetDialogOpen: boolean;
    setIsRenivetDialogOpen: (value: boolean) => void;
}

export default function RenivetRecommanded({
    isRenivetDialogOpen,
    setIsRenivetDialogOpen,
}: PageProps) {
    return (
        <>
            <Dialog
                open={isRenivetDialogOpen}
                onOpenChange={()=>{
                    setIsRenivetDialogOpen(false);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renivet Suggested Shipping</DialogTitle>
                        <DialogDescription>
                            Suggested shipping options and actions based on
                            order data.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Your child component goes here */}
                    Child Data
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRenivetDialogOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
