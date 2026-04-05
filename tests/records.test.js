const request = require("supertest");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

describe("Record Routes", () => {
    let token;
    let userId;

    beforeAll(async () => {
        // Create an admin user for testing
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Admin Record Tester",
                email: "admin_record_tester@example.com",
                password: "password123"
            });
        
        await prisma.user.update({
            where: { email: "admin_record_tester@example.com" },
            data: { role: "ADMIN" }
        });

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin_record_tester@example.com", password: "password123" });
        token = loginRes.body.data.token;
        userId = loginRes.body.data.user.id;
    });

    afterAll(async () => {
        const emails = ["admin_record_tester@example.com", "viewer_test@example.com"];
        await prisma.financialRecord.deleteMany({ 
            where: { createdByUser: { email: { in: emails } } } 
        });
        await prisma.user.deleteMany({ where: { email: { in: emails } } });
        await prisma.$disconnect();
    });

    test("POST /api/records", async () => {
        const res = await request(app)
            .post("/api/records")
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "INCOME",
                category: "Salary",
                amount: 5000,
                date: new Date().toISOString(),
                notes: "Initial salary"
            });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(Number(res.body.data.amount)).toBe(5000);
    });

    test("GET /api/records - Authorized Access", async () => {
        const res = await request(app)
            .get("/api/records")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.records).toBeInstanceOf(Array);
    });

    describe("RBAC Enforcement (Role Boundaries)", () => {
        let viewerToken;

        beforeAll(async () => {
            // Create a dedicated viewer
            await request(app).post("/api/auth/register").send({
                name: "Viewer Tester",
                email: "viewer_test@example.com",
                password: "password123"
            });
            // (Standard role is VIEWER by default)
            const loginRes = await request(app).post("/api/auth/login").send({
                email: "viewer_test@example.com",
                password: "password123"
            });
            viewerToken = loginRes.body.data.token;
        });

        // (teardown handled by top-level afterAll)

        test("VIEWER cannot create a record (403 Forbidden)", async () => {
            const res = await request(app)
                .post("/api/records")
                .set("Authorization", `Bearer ${viewerToken}`)
                .send({ amount: 100, type: "INCOME", category: "Test", date: new Date() });
            
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        test("ADMIN can access deleted records", async () => {
            const res = await request(app)
                .get("/api/records/deleted")
                .set("Authorization", `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
