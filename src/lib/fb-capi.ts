import { db } from "@/lib/db";
import { capiLogs } from "@/lib/db/schema";
import {
    CustomData,
    EventRequest,
    FacebookAdsApi,
    ServerEvent,
    UserData,
} from "facebook-nodejs-business-sdk";

const ACCESS_TOKEN =
    "EAAPw9alHhHkBPYBbt8Kx8aAZC89lcb3f4pcZBMpn1ZAP15RBbngINvEI9rLiL6qcjxD6cjUxhyZAtd8isifpCEE0bHCjZCFveZCsEySokIA69IEDN8rVO5hdif9ATly3xllA5GV79yOkdekTdyLoHZBI2pPwsW6EqW3wLRvboZCvYVxDLkqvlB740Sel14ZAZCuwZDZD";
const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "618442627790500";

FacebookAdsApi.init(ACCESS_TOKEN ?? "");

export type CapiUserData = {
    em?: string;
    ph?: string;
    fn?: string;
    ln?: string;
    db?: string;
    ge?: string;
    ct?: string;
    st?: string;
    zp?: string;
    country?: string;
    external_id?: string;
    fb_login_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbp?: string;
    fbc?: string;
};

export type CapiCustomData = {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    order_id?: string;
    predicted_ltv?: number;
    num_items?: number;
    search_string?: string;
    status?: string;
    delivery_category?: string;
};

export const sendCapiEvent = async (
    eventName: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    eventId: string,
    eventSourceUrl: string
) => {
    if (!ACCESS_TOKEN) {
        console.warn("FACEBOOK_ACCESS_TOKEN not found, skipping CAPI event.");
        return;
    }

    const current_timestamp = Math.floor(new Date().getTime() / 1000);

    const user = new UserData();
    if (userData.em) user.setEmail(userData.em);
    if (userData.ph) user.setPhone(userData.ph);
    if (userData.fn) user.setFirstName(userData.fn);
    if (userData.ln) user.setLastName(userData.ln);
    if (userData.db) user.setDateOfBirth(userData.db);
    if (userData.ge) user.setGender(userData.ge);
    if (userData.ct) user.setCity(userData.ct);
    if (userData.st) user.setState(userData.st);
    if (userData.zp) user.setZip(userData.zp);
    if (userData.country) user.setCountry(userData.country);
    if (userData.external_id) user.setExternalId(userData.external_id);
    if (userData.fb_login_id) user.setFbLoginId(userData.fb_login_id);
    if (userData.client_ip_address)
        user.setClientIpAddress(userData.client_ip_address);
    if (userData.client_user_agent)
        user.setClientUserAgent(userData.client_user_agent);
    if (userData.fbp) user.setFbp(userData.fbp);
    if (userData.fbc) user.setFbc(userData.fbc);

    const custom = new CustomData();
    if (customData.content_name) custom.setContentName(customData.content_name);
    if (customData.content_category)
        custom.setContentCategory(customData.content_category);
    if (customData.content_ids) custom.setContentIds(customData.content_ids);
    if (customData.content_type) custom.setContentType(customData.content_type);
    if (customData.value !== undefined) custom.setValue(customData.value);
    if (customData.currency) custom.setCurrency(customData.currency);
    if (customData.order_id) custom.setOrderId(customData.order_id);
    if (customData.predicted_ltv !== undefined)
        custom.setPredictedLtv(customData.predicted_ltv);
    if (customData.num_items !== undefined)
        custom.setNumItems(customData.num_items);
    if (customData.search_string)
        custom.setSearchString(customData.search_string);
    if (customData.status) custom.setStatus(customData.status);
    if (customData.delivery_category)
        custom.setDeliveryCategory(customData.delivery_category);

    const serverEvent = new ServerEvent()
        .setEventName(eventName)
        .setEventTime(current_timestamp)
        .setUserData(user)
        .setCustomData(custom)
        .setEventSourceUrl(eventSourceUrl)
        .setActionSource("website")
        .setEventId(eventId);

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(ACCESS_TOKEN, PIXEL_ID).setEvents(
        eventsData
    );

    let responseData;
    let status = "success";

    try {
        const response = await eventRequest.execute();
        console.log(
            `CAPI Event '${eventName}' sent successfully. Event ID: ${eventId}`
        );
        responseData = response;
    } catch (error: any) {
        console.error(`Failed to send CAPI Event '${eventName}':`, error);
        status = "failed";
        responseData = error?.response || { message: error.message };
    }

    // Attempt to log regardless of success or failure
    try {
        await db.insert(capiLogs).values({
            eventName,
            eventId,
            userData: userData as any,
            customData: customData as any,
            status,
            response: responseData,
        });
    } catch (dbError) {
        console.error("Failed to log CAPI event to database:", dbError);
    }

    return responseData;
};
