"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
} from "react";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

const Form = FormProvider;

const FormFieldContext = createContext<string>("");

function FormFieldWrapper(props: {
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: controller type
  control?: any;
  render?: (props: {
    // biome-ignore lint/suspicious/noExplicitAny: field type from Controller
    field: any;
    // biome-ignore lint/suspicious/noExplicitAny: fieldState type
    fieldState: any;
    // biome-ignore lint/suspicious/noExplicitAny: formState type
    formState: any;
  }) => React.ReactNode;
  // biome-ignore lint/suspicious/noExplicitAny: defaultValue type
  defaultValue?: any;
  // biome-ignore lint/suspicious/noExplicitAny: rules type
  rules?: any;
  shouldUnregister?: boolean;
}) {
  // biome-ignore lint/suspicious/noExplicitAny: need to bypass Controller type
  const ControllerAny = Controller as any;
  return (
    <FormFieldContext.Provider value={props.name}>
      <ControllerAny {...props} />
    </FormFieldContext.Provider>
  );
}

const FormItemContext = createContext<{
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
}>({
  formItemId: "",
  formDescriptionId: "",
  formMessageId: "",
});

function FormItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const id = useId();
  const formItemId = `${id}-form-item`;
  const formDescriptionId = `${id}-form-item-description`;
  const formMessageId = `${id}-form-item-message`;

  return (
    <FormItemContext.Provider
      value={{ formItemId, formDescriptionId, formMessageId }}
    >
      <div className={cn("space-y-1", className)} {...props}>
        {children}
      </div>
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { formItemId } = useContext(FormItemContext);
  return (
    <label htmlFor={formItemId} className={cn(className)} {...props}>
      {children}
    </label>
  );
}

function FormControl({ children }: { children: React.ReactNode }) {
  const { formItemId, formDescriptionId, formMessageId } =
    useContext(FormItemContext);
  const fieldName = useContext(FormFieldContext);
  const { getFieldState } = useFormContext();
  const fieldState = getFieldState(fieldName);

  if (isValidElement(children)) {
    return cloneElement(
      children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
      {
        id: formItemId,
        "aria-describedby": fieldState.invalid
          ? `${formDescriptionId} ${formMessageId}`
          : formDescriptionId,
        "aria-invalid": fieldState.invalid,
      },
    );
  }
  return <>{children}</>;
}

function FormDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { formDescriptionId } = useContext(FormItemContext);
  return (
    <p id={formDescriptionId} className={cn(className)} {...props}>
      {children}
    </p>
  );
}

function FormMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { formMessageId } = useContext(FormItemContext);
  const fieldName = useContext(FormFieldContext);
  const { getFieldState } = useFormContext();
  const fieldState = getFieldState(fieldName);

  if (!fieldState.invalid) return null;

  return (
    <p
      id={formMessageId}
      className={cn("text-xs font-medium", className)}
      {...props}
    >
      {fieldState.error?.message || children}
    </p>
  );
}

export {
  Form,
  FormFieldWrapper as FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
};
