import { createFormContext } from "@mantine/form";

// Create a generic form context that can be used with any form values type
export const [FormProvider, useFormContext, useForm] = createFormContext<any>();
