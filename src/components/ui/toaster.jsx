import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const getIcon = (variant) => {
      switch(variant) {
          case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
          case 'destructive': return <XCircle className="h-5 w-5 text-red-500" />;
          case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
          case 'info': return <Info className="h-5 w-5 text-blue-500" />;
          default: return null;
      }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3 w-full">
                 {getIcon(variant) && (
                     <div className="flex-shrink-0 mt-0.5 animate-in zoom-in duration-300">
                         {getIcon(variant)}
                     </div>
                 )}
                <div className="grid gap-1 flex-1">
                    {title && <ToastTitle>{title}</ToastTitle>}
                    {description && (
                        <ToastDescription>{description}</ToastDescription>
                    )}
                </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}