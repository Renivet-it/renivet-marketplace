import axios from "axios";
import { XMLParser } from "fast-xml-parser";

export type UnicommerceInventorySnapshot = {
    itemSku: string;
    inventory: number;
    openSale?: number;
    openPurchase?: number;
    putawayPending?: number;
    inventoryBlocked?: number;
};

export type UnicommerceConnection = {
    tenant?: string | null;
    facilityId?: string | null;
    baseUrl?: string | null;
    username: string;
    password: string;
};

const SOAP_NS = "http://schemas.xmlsoap.org/soap/envelope/";
const SERVICE_NS = "http://uniware.unicommerce.com/services/";
const WSSE_NS =
    "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd";
const WSU_NS =
    "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd";

const xmlEscape = (val: string) =>
    val
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&apos;");

const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
});

export class UnicommerceClient {
    private endpoint: string;
    private connection: UnicommerceConnection;

    constructor(connection: UnicommerceConnection) {
        this.connection = connection;
        this.endpoint = this.getEndpoint();
    }

    private getEndpoint() {
        if (this.connection.baseUrl) return this.connection.baseUrl;
        if (!this.connection.tenant || !this.connection.facilityId) {
            throw new Error(
                "Unicommerce endpoint config missing. Provide `baseUrl` or `tenant + facilityId`."
            );
        }

        return `https://${this.connection.tenant}.unicommerce.com:443/services/soap/?version=1.6&facility=${this.connection.facilityId}`;
    }

    private buildWsseHeader() {
        const created = new Date().toISOString();
        const nonce = Buffer.from(`${created}:${Math.random()}`)
            .toString("base64")
            .replace(/=+$/g, "");

        return `
<soapenv:Header>
  <wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="${WSSE_NS}" xmlns:wsu="${WSU_NS}">
    <wsse:UsernameToken wsu:Id="UsernameToken-1">
      <wsse:Username>${xmlEscape(this.connection.username)}</wsse:Username>
      <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${xmlEscape(this.connection.password)}</wsse:Password>
      <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce}</wsse:Nonce>
      <wsu:Created>${created}</wsu:Created>
    </wsse:UsernameToken>
  </wsse:Security>
</soapenv:Header>`;
    }

    private buildEnvelope(bodyXml: string) {
        return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="${SOAP_NS}" xmlns:ser="${SERVICE_NS}">
${this.buildWsseHeader()}
<soapenv:Body>
${bodyXml}
</soapenv:Body>
</soapenv:Envelope>`;
    }

    async getInventorySnapshot(params: {
        skus?: string[];
        updatedSinceMinutes?: number;
    }): Promise<UnicommerceInventorySnapshot[]> {
        const { skus = [], updatedSinceMinutes = 60 } = params;

        const itemsXml = skus.length
            ? `<ser:ItemTypes>${skus
                  .map(
                      (sku) =>
                          `<ser:ItemType><ser:ItemSKU>${xmlEscape(
                              sku
                          )}</ser:ItemSKU></ser:ItemType>`
                  )
                  .join("")}</ser:ItemTypes>`
            : "";

        const body = `
<ser:GetInventorySnapshotRequest>
  ${itemsXml}
  <ser:UpdatedSinceInMinutes>${updatedSinceMinutes}</ser:UpdatedSinceInMinutes>
</ser:GetInventorySnapshotRequest>`;

        const envelope = this.buildEnvelope(body);

        const response = await axios.post(this.endpoint, envelope, {
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
            },
            timeout: 30000,
        });

        const parsed = parser.parse(response.data);
        const result = parsed?.Envelope?.Body?.GetInventorySnapshotResponse;
        if (!result || String(result.Successful).toLowerCase() !== "true") {
            return [];
        }

        const snapshots = result.InventorySnapshots?.InventorySnapshot;
        if (!snapshots) return [];

        const list = Array.isArray(snapshots) ? snapshots : [snapshots];
        return list
            .map((s: any) => ({
                itemSku: String(s.ItemSKU || "").trim(),
                inventory: Number(s.Inventory ?? 0),
                openSale: Number(s.OpenSale ?? 0),
                openPurchase: Number(s.OpenPurchase ?? 0),
                putawayPending: Number(s.PutawayPending ?? 0),
                inventoryBlocked: Number(s.InventoryBlocked ?? 0),
            }))
            .filter((s: UnicommerceInventorySnapshot) => s.itemSku.length >
                0);
    }
}