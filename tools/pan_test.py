import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg = await b.new_page(viewport={'width':1600,'height':900})
        await pg.goto('file:///home/claude/ett101sim/dist/index.html'); await pg.wait_for_timeout(600)
        vb = lambda: pg.evaluate("document.getElementById('bench').getAttribute('viewBox')")
        print('both', await vb())
        await pg.mouse.move(1300,800); await pg.keyboard.down('Control'); await pg.mouse.wheel(0,-300); await pg.keyboard.up('Control'); await pg.wait_for_timeout(100); print('ctrl+wheel in', await vb())
        await pg.mouse.move(1300,850); await pg.mouse.down(); await pg.mouse.move(1100,700,steps=6); await pg.mouse.up(); print('pan', await vb())
        await pg.click('#vKit'); print('kit', await vb()); await pg.keyboard.press('3'); print('key 3 scope', await vb())
        z = await pg.evaluate("window.devicePixelRatio + ' ' + document.body.style.zoom"); print('page zoom untouched', z)
        await b.close()
asyncio.run(main())
