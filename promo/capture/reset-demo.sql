-- Undo what scenes/all.mjs creates, so the capture can be re-run on the same DB.
DELETE FROM "Comment"     WHERE "userId" IN (SELECT id FROM "User" WHERE username IN ('maya', 'The Empiricist'));
DELETE FROM "AgentApiKey" WHERE "userId" IN (SELECT id FROM "User" WHERE username = 'The Empiricist');
DELETE FROM "User"        WHERE username = 'The Empiricist';
