import sys, asyncio, json
from playwright.async_api import async_playwright
OUT='/tmp/claude-0/-home-claude/7769ccca-1829-53e2-911f-c6071462c562/scratchpad/shots/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width':1920,'height':1040}, device_scale_factor=float(sys.argv[2]) if len(sys.argv)>2 else 1)
        logs=[]
        pg.on('console', lambda m: logs.append(m.type+': '+m.text))
        pg.on('pageerror', lambda e: logs.append('PAGEERROR: '+str(e)))
        await pg.goto('file:///home/claude/ett101sim/dist/index.html')
        await pg.wait_for_timeout(1500)
        script = sys.argv[1] if len(sys.argv)>1 else ''
        if script:
            await pg.evaluate(open(script).read())
            await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT+'full.png')
        if len(sys.argv)>3:
            x,y,w,h=map(int,sys.argv[3].split(','))
            await pg.screenshot(path=OUT+'clip.png', clip={'x':x,'y':y,'width':w,'height':h})
        perf = await pg.evaluate('window.__perf && window.__perf()')
        print('perf ms/frame', perf)
        for l in logs[:20]: print(l)
        await b.close()
asyncio.run(main())
