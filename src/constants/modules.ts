import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { ModuleType, ProfileModule } from "../types/profile";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface ModuleDefinition {
  type: ModuleType;
  label: string;
  icon: IoniconName;
  placeholder: string;
  keyboardType: "default" | "phone-pad" | "email-address" | "url";
  multiline?: boolean;
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    type: "phone",
    label: "Teléfono",
    icon: "call-outline",
    placeholder: "Ej. +58 412 123 4567",
    keyboardType: "phone-pad",
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    icon: "logo-whatsapp",
    placeholder: "Ej. +58 412 123 4567 (con código de país)",
    keyboardType: "phone-pad",
  },
  {
    type: "instagram",
    label: "Instagram",
    icon: "logo-instagram",
    placeholder: "Ej. @usuario",
    keyboardType: "default",
  },
  {
    type: "email",
    label: "Correo electrónico",
    icon: "mail-outline",
    placeholder: "Ej. nombre@correo.com",
    keyboardType: "email-address",
  },
  {
    type: "location",
    label: "Ubicación",
    icon: "location-outline",
    placeholder: "Ej. Caracas, Venezuela",
    keyboardType: "default",
  },
  {
    type: "description",
    label: "Descripción",
    icon: "document-text-outline",
    placeholder: "Ej. Breve reseña, rol o especialidad...",
    keyboardType: "default",
    multiline: true,
  },
  {
    type: "website",
    label: "Sitio web",
    icon: "globe-outline",
    placeholder: "Ej. https://miportafolio.com",
    keyboardType: "url",
  },
];

export const CUSTOM_MODULE_DEFINITION: ModuleDefinition = {
  type: "custom",
  label: "Sección personalizada",
  icon: "pricetag-outline",
  placeholder: "Escribe el contenido de esta sección...",
  keyboardType: "default",
  multiline: true,
};

const MODULE_MAP: Record<ModuleType, ModuleDefinition> = [
  ...MODULE_DEFINITIONS,
  CUSTOM_MODULE_DEFINITION,
].reduce(
  (acc, item) => {
    acc[item.type] = item;
    return acc;
  },
  {} as Record<ModuleType, ModuleDefinition>,
);

export function getModuleMeta(
  module: Pick<ProfileModule, "type" | "label">,
): ModuleDefinition {
  const base = MODULE_MAP[module.type] ?? CUSTOM_MODULE_DEFINITION;

  if (module.type === "custom") {
    const customLabel = module.label?.trim();
    return {
      ...base,
      label: customLabel && customLabel.length > 0 ? customLabel : base.label,
    };
  }

  return base;
}

export function buildModuleActionUrl(
  type: ModuleType,
  value: string,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  switch (type) {
    case "phone": {
      const cleaned = trimmed.replace(/[^\d+]/g, "");
      return cleaned ? `tel:${cleaned}` : null;
    }
    case "whatsapp": {
      const digits = trimmed.replace(/\D/g, "");
      return digits ? `https://wa.me/${digits}` : null;
    }
    case "instagram": {
      if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
      }
      const handle = trimmed.replace(/^@+/, "").split("/")[0];
      return handle ? `https://instagram.com/${handle}` : null;
    }
    case "email": {
      return trimmed.includes("@") ? `mailto:${trimmed}` : null;
    }
    case "website": {
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    }
    case "custom": {
      return /^https?:\/\//i.test(trimmed) ? trimmed : null;
    }
    case "location":
    case "description":
    default:
      return null;
  }
}
