"use client";

import { PageLoading } from "@/shared/components/Loading";
import { BRAND } from "@/shared/constants/appConfig";

export default function AppLoading() {
  return <PageLoading message={`Loading ${BRAND.name}...`} />;
}
