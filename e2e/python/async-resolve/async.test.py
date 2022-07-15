import asyncio
from flake import _

async def main():
	await asyncio.sleep(0.5)
	return 42

result = asyncio.run(main())

_(result == 42)