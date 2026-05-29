"use client";

import { ProductAppShell, renderProductRoute } from "../product-render";
import { Route } from "../../product-ui/routes/app.realclaw";

export default function RealClawPage() {
  return <ProductAppShell>{renderProductRoute(Route)}</ProductAppShell>;
}
