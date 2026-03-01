import type { DetailedHTMLProps, HTMLAttributes } from "react";

type IconifyIconAttributes = DetailedHTMLProps<
    HTMLAttributes<HTMLElement> & {
        icon: string;
        width?: string | number;
        height?: string | number;
        inline?: boolean;
        rotate?: string;
        flip?: string;
        mode?: string;
    },
    HTMLElement
>;

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "iconify-icon": IconifyIconAttributes;
        }
    }
}
