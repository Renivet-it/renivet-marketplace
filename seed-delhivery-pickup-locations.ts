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
    console.log("🔹 Step 1: Fetching brands from cache or DB...");
    let brands: any[] = [];
    try {
      brands = await brandCache.getAll();
      console.log(`📦 Loaded ${brands.length} brands from Redis cache.`);
    } catch (err) {
      console.warn("⚠️ Redis cache unavailable, fetching from DB...");
      brands = await db.query.brands.findMany();
      console.log(`📦 Loaded ${brands.length} brands from DB instead.`);
    }

    if (!brands?.length) {
      console.log("⚠️ No brands found, exiting.");
      return;
    }

    console.log(`🟢 Found ${brands.length} brands in total.\n`);

    let successCount = 0;
    let failCount = 0;

    // Sequential loop → stable, avoids Delhivery rate limit
    for (const brand of brands) {
      console.log("────────────────────────────────────────────");
      console.log(`🏗️ Processing brand: ${brand.name} (ID: ${brand.id})`);

      // STEP 2: Generate warehouse code
      const warehouseName = generatePickupLocationCode({
        brandId: brand.id,
        brandName: brand.name,
      });
      console.log(`📍 Warehouse Name Generated → ${warehouseName}`);

      // STEP 3: Fetch brand confidential safely using your helper
      console.log("🔹 Fetching brand confidential...");
      const confidential = await brandConfidentialQueries.getBrandConfidential(
        brand.id
      );
      if (!confidential) {
        console.warn(`⚠️ No confidential found for brand: ${brand.name}`);
      } else {
        console.log("✅ Confidential data found.");
      }

      // STEP 4: Prepare pickup + return data
      console.log("🔹 Preparing pickup and return address data...");
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

      console.log("📦 Prepared Warehouse Payload →", {
        name: warehouseName,
        registered_name: brand.name,
        phone,
        email,
        address: pickupAddress,
        city: pickupCity,
        pin: pickupPin,
        country: pickupCountry,
        return_address: returnAddress,
        return_city: returnCity,
        return_pin: returnPin,
        return_state: returnState,
        return_country: returnCountry,
      });

      // STEP 5: Make Delhivery API call
      console.log("🔹 Calling Delhivery API...");
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

      // STEP 6: Handle response
      if (result.success) {
        console.log(`✅ SUCCESS: ${brand.name} registered as "${warehouseName}"`);
        console.log("📨 Delhivery API Response →", result.data);
        successCount++;
      } else {
        console.error(`❌ FAILED: ${brand.name} (${warehouseName})`);
        console.error("🧾 Error Details →", result.error);
        failCount++;
      }

      console.log("⏳ Waiting 1 second before next brand...");
      await new Promise((res) => setTimeout(res, 10000)); // rate-limit delay
    }

    console.log("\n🎯 Delhivery seeding finished!");
    console.log(`✅ Success Count: ${successCount}`);
    console.log(`❌ Failed Count: ${failCount}`);
  } catch (err: any) {
    console.error("💥 Fatal error:", err.message || err);
    console.error(err);
  } finally {
    console.log("🧹 Seeder finished, exiting process...");
    process.exit(0);
  }
}

seedDelhiveryWarehouses();
