import { Dialog, DialogContent } from "@/components/ui/dialog";

export function ImageViewModal({
    open,
    onOpenChange,
    imageUrl,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageUrl?: string;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] h-[90vh]">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt="Full size receipt"
                        className="w-full h-full object-contain"
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
