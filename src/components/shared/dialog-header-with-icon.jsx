// src\components\shared\dialog-header-with-icon.jsx
import { DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";

export default function DialogHeaderWithIcon({
  icon: Icon,
  title,
  description,
}) {
  return (
     <DialogHeader>
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
      </div>

      <div>
        <DialogTitle>{title}</DialogTitle>
        {description && (
          <DialogDescription>{description}</DialogDescription>
        )}
      </div>
    </div>
    </DialogHeader>
  );
}