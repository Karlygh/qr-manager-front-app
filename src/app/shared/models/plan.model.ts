export interface Plan {
  name: string;
  monthlyPrice: string;
  monthlyPriceNum: number;
  yearlyPrice: string;
  freeMonths: number;
  features: string[];
  isFeatured: boolean;
}
