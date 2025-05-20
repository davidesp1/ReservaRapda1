import React from "react";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Smartphone } from "lucide-react";

// Schema de validação para o MBWay
const mbwaySchema = z.object({
  phone: z
    .string()
    .min(9, { message: "Número de telefone deve ter pelo menos 9 dígitos" })
    .max(9, { message: "Número de telefone deve ter 9 dígitos" })
    .regex(/^[0-9]+$/, { message: "Apenas números são permitidos" }),
});

type MBWayFormValues = z.infer<typeof mbwaySchema>;

interface MBWayFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MBWayFormValues) => void;
  defaultPhone?: string;
}

const MBWayForm: React.FC<MBWayFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  defaultPhone = "",
}) => {
  const { t } = useTranslation();
  
  const form = useForm<MBWayFormValues>({
    resolver: zodResolver(mbwaySchema),
    defaultValues: {
      phone: defaultPhone,
    },
  });

  const handleSubmit = (values: MBWayFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center">
              <Smartphone className="mr-2 h-5 w-5" />
              {t("MBWayPhoneNumber")}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PhoneNumber")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="912345678"
                      {...field}
                      maxLength={9}
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mr-2"
              >
                {t("Cancel")}
              </Button>
              <Button type="submit">{t("Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MBWayForm;