declare module 'postcss-resolve-nested-selector' {
  import { Rule } from 'postcss';
  export default function(selector: string, rule: Rule): string[];
}
