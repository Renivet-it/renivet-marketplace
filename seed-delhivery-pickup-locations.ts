/* eslint-disable no-console */
import "dotenv/config";
import { brandCache } from "@/lib/redis/methods";
import { createClientWarehouse } from "@/lib/delhivery/warehouse";
import { brandConfidentialQueries } from "@/lib/db/queries";
import { generatePickupLocationCode, getRawNumberFromPhone } from "@/lib/utils";
import { db } from "@/lib/db";

async function seedDelhiveryWarehouses() {
  console.log("🚀 Starting Delhivery warehouse seeder...\n");

  try {
    // STEP 1: Load all brands (prefer cache)
    let brands: any[] = [];
    try {
      brands = await brandCache.getAll();
    } catch (err) {
      console.warn("⚠️ Redis cache unavailable, fetching from DB...");
      brands = await db.query.brands.findMany();
    }

    if (!brands?.length) {
      console.log("⚠️ No brands found, exiting.");
      return;
    }

    console.log(`🟢 Found ${brands.length} brands.\n`);
    let successCount = 0;
    let failCount = 0;

    // Sequential loop → stable, avoids Delhivery rate limit
    for (const brand of brands) {
      const warehouseName = generatePickupLocationCode({
        brandId: brand.id,
        brandName: brand.name,
      });

      console.log(`\n🏗️ Processing brand: ${brand.name} → ${warehouseName}`);

      // STEP 2: Fetch brand confidential safely using your helper
      const confidential = await brandConfidentialQueries.getBrandConfidential(brand.id);

      if (!confidential) {
        console.warn(`⚠️ No confidential found for brand: ${brand.name}`);
      }

      // STEP 3: Prepare pickup + return data
      const phone = String(
        getRawNumberFromPhone(
          confidential?.authorizedSignatoryPhone ??
            brand.phone ??
            "9999999999"
        ) ?? "9999999999"
      );

      const email =
        confidential?.authorizedSignatoryEmail ??
        brand.email ??
        "noreply@example.com";

      const pickupAddress =
        confidential?.warehouseAddressLine1 ??
        confidential?.addressLine1 ??
        "Unknown Address";

      const pickupCity =
        confidential?.warehouseCity ??
        confidential?.city ??
        brand.city ??
        "Unknown";

      const pickupState =
        confidential?.warehouseState ??
        confidential?.state ??
        brand.state ??
        "Unknown";

      const pickupPin =
        confidential?.warehousePostalCode ??
        confidential?.postalCode ??
        brand.postalCode ??
        "000000";

      const pickupCountry =
        confidential?.warehouseCountry ??
        confidential?.country ??
        brand.country ??
        "India";

      const returnAddress = confidential?.warehouseAddressLine1 ?? pickupAddress;
      const returnCity = confidential?.warehouseCity ?? pickupCity;
      const returnPin = confidential?.warehousePostalCode ?? pickupPin;
      const returnState = confidential?.warehouseState ?? pickupState;
      const returnCountry = confidential?.warehouseCountry ?? pickupCountry;

      // STEP 4: Make Delhivery API call
      const result = await createClientWarehouse({
        name: warehouseName,
        registered_name: brand.name,
        phone,
        email,
        address: pickupAddress,
        city: pickupCity,
        pin: String(pickupPin),
        country: pickupCountry,
        return_address: returnAddress,
        return_city: returnCity,
        return_pin: String(returnPin),
        return_state: returnState,
        return_country: returnCountry,
      });

      if (result.success) {
        console.log(`✅ SUCCESS: ${brand.name} registered as "${warehouseName}"`);
        successCount++;
      } else {
        console.error(`❌ FAILED: ${brand.name} (${warehouseName}) →`, result.error);
        failCount++;
      }

      await new Promise((res) => setTimeout(res, 1000)); // rate-limit delay
    }

    console.log("\n🎯 Delhivery seeding finished!");
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
  } catch (err: any) {
    console.error("💥 Fatal error:", err.message || err);
  } finally {
    process.exit(0);
  }
}

seedDelhiveryWarehouses();