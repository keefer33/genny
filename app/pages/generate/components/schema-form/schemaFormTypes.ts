export interface NestedFieldRendererProps {
  properties: Record<string, any>;
  required: string[];
  fieldPrefix?: string;
  generationType?: "image" | "video";
}

export interface ObjectArrayRendererProps {
  fieldName: string;
  fieldSchema: any;
  isRequired?: boolean;
  fieldPrefix?: string;
  generationType?: "image" | "video";
}

export interface StringArrayRendererProps {
  fieldName: string;
  fieldSchema: any;
  isRequired?: boolean;
  fieldPrefix?: string;
}
