-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "adminToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "maxChoices" INTEGER,
    "dupMode" TEXT NOT NULL DEFAULT 'device',
    "showResults" BOOLEAN NOT NULL DEFAULT false,
    "resultsShared" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closesAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Poll" ("adminToken", "allowMultiple", "closesAt", "createdAt", "description", "dupMode", "id", "isClosed", "maxChoices", "showResults", "slug", "title") SELECT "adminToken", "allowMultiple", "closesAt", "createdAt", "description", "dupMode", "id", "isClosed", "maxChoices", "showResults", "slug", "title" FROM "Poll";
DROP TABLE "Poll";
ALTER TABLE "new_Poll" RENAME TO "Poll";
CREATE UNIQUE INDEX "Poll_slug_key" ON "Poll"("slug");
CREATE UNIQUE INDEX "Poll_adminToken_key" ON "Poll"("adminToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
