import os
import json
import time
from workers import WorkerEntrypoint, Response


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        url = request.url
        method = request.method

        if method == "GET" and url.endswith("/health"):
            return Response("OK", status=200)

        if method == "POST" and "/upload" in url:
            return await self.handle_upload(request)

        if method == "GET" and "/f/" in url:
            file_id = url.split("/f/")[-1].split("?")[0]
            return await self.handle_download(file_id)

        return await self.env.ASSETS.fetch(request)

    async def handle_upload(self, request):
        auth = request.headers.get("Authorization", "")
        token = self.env.UPLOAD_TOKEN

        if auth != f"Bearer {token}":
            return Response("Forbidden", status=403)

        form_data = await request.formData()
        file = form_data.get("file")

        if not file:
            return Response("No file", status=400)

        file_id = os.urandom(6).hex()
        created = str(int(time.time() * 1000))

        await self.env.FILE_STORAGE.put(
            file_id,
            file.stream(),
            {
                "httpMetadata": {"contentType": file.type or "application/octet-stream"},
                "customMetadata": {
                    "created": created,
                    "originalName": file.name,
                    "mime": file.type or "application/octet-stream",
                },
            },
        )

        expiry = int(self.env.FILE_EXPIRY or 300000)
        return Response(
            json.dumps({"id": file_id, "expiresIn": expiry}),
            headers={"Content-Type": "application/json"},
        )

    async def handle_download(self, file_id):
        obj = await self.env.FILE_STORAGE.get(file_id)

        if obj is None:
            return Response("Expired", status=404)

        created = int(obj.customMetadata.get("created", "0"))
        expiry = int(self.env.FILE_EXPIRY or 300000)

        if int(time.time() * 1000) - created > expiry:
            await self.env.FILE_STORAGE.delete(file_id)
            return Response("Expired", status=404)

        original_name = obj.customMetadata.get("originalName", "file")
        mime = obj.customMetadata.get("mime", "application/octet-stream")

        headers = {
            "Content-Type": mime,
            "Content-Disposition": f'attachment; filename="{original_name}"',
            "Content-Length": str(obj.size),
        }

        await self.env.FILE_STORAGE.delete(file_id)

        return Response(obj.body, headers=headers)
