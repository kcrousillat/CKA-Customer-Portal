# Builds an artifact copy of the portal with a snapshot of the example job
# baked in, so the page can be clicked through before the Worker is deployed.
import json, re, datetime

SP = {"wh":("rec9e2TXsXeiIM0gz","Whole house",1),"kit":("recKswtwEa2AF7E0Z","Kitchen",2),
      "bar":("rec8Ss5sopaMsIiDh","Morning bar",3),"pbt":("recJrBKxoq2NC07R2","Primary bath",4),
      "cbt":("recpe9cliBwFy8HHs","Cabana bath",5),"pwd":("recldoarfmmMilRzn","Powder",6),
      "lnd":("recR9XQCBhyfuFFDh","Laundry",7),"clo":("recK1F3KWRnvNv5Uk","Primary closet",8),
      "str":("recEhYMFmieYj318U","Main stair",9),"elv":("recH8k3uNPNQUsxgy","Elevator",10),
      "sk":("recLLDh6p1deD06xo","Summer kitchen",11),"pool":("rec2RS8aAHvQeK3UR","Pool & deck",12),
      "gar":("recKpeKrqWBxT2w65","Garage",13)}

S = [
 ("recjpkZNCZA9sJj0x","Cab interior package","elv","Elevator",20,"2026-09-18","Options presented","curated",
  "Cab walls, ceiling, handrail and fixture finish. Longest lead package on the job and the state inspection is scheduled off the cab order, so this one moves the certificate of occupancy, not just the finish date.",1),
 ("recimJy9zkarHTF8Z","Window & door frame color","wh","Glazing",14,"2026-09-25","Options presented","curated",
  "Factory finish on all impact windows and exterior doors. Frames are powder-coated before shipping and cannot be changed on site, so the color locks when the package is released.",2),
 ("recHgmsNVZwTbRntM","Front entry door","wh","Millwork",16,"2026-10-02","Not started","open",
  "Pivot or swing, impact rated, with glazing and hardware. Tell us the maker and model you want and we will confirm the rough opening and the structural header before it is ordered.",3),
 ("rec8UnDcVLatisSoe","Roof tile profile & color","wh","Roofing",10,"2026-10-09","Not started","curated",
  "Concrete tile profile and color blend. Drives the fascia and gutter color and is visible in every elevation the review board sees.",4),
 ("recsFxAAemso55BR0","Appliance package","kit","Appliances",16,"2026-10-16","Owner selected","open",
  "Refrigeration, range, ventilation, dishwashers and beverage units. Panel-ready units have to be confirmed with the cabinet shop before doors are cut.",5),
 ("reclC6n7EoFYxaYKh","Garage doors","gar","Doors",8,"2026-12-04","Not started","curated",
  "Two 9' x 8' impact-rated doors on the motor court elevation.",6),
 ("rec8OEXhn2yG0tWGe","Cabinet door style & finish","kit","Millwork",12,"2026-11-13","Options presented","curated",
  "Perimeter and island cabinetry. The island can run a second finish — tell us in the notes and we will price it.",7),
 ("rec736Xh8GVP2YteN","Plumbing fixtures","kit","Plumbing",8,"2026-11-20","Not started","curated",
  "Main sink faucet, prep sink faucet and pot filler. The finish carries through to the cabinet hardware.",8),
 ("recqWIZEmJnxpZ3K2","Countertop slab","kit","Stone",6,"2026-12-18","Not started","open",
  "Perimeter and island tops with a full-height backsplash at the range. Slabs are picked in person at the yard — we will book the walk and hold your slabs for 30 days.",9),
 ("receznAjmxgPkTP8R","Backsplash tile","kit","Tile",6,"2027-01-08","On hold","curated",
  "On hold until the countertop slab is tagged — the backsplash reads off the slab. Nothing to do here yet.",10),
 ("recDYuTvrMpNcpDPe","Plumbing trim finish","pbt","Plumbing",8,"2026-12-11","Options presented","curated",
  "Shower valves, tub filler, lavatory faucets and accessories. One finish for the whole room; the rough valves are already set so only the trim changes.",11),
 ("recx9Y9GYLP2SfYll","Floor tile","pbt","Tile",6,"2027-01-08","Not started","curated",
  "Field tile for the bath floor, running into the shower with a linear drain.",12),
 ("recWE4cwq6GondJrQ","Shower wall tile","pbt","Tile",6,"2027-01-08","Not started","curated",
  "Wet wall and niche. Tell us in the notes if you want the niche in a contrasting material.",13),
 ("recyhpRuy7R0hl9Bl","Vanity top","pbt","Stone",6,"2027-01-15","Not started","open",
  "Double vanity top with an integral or undermount basin. Enter the yard and slab name, or ask us to bring samples that work with the floor tile.",14),
 ("recaCmgPeC6igYSl1","Shower enclosure","pbt","Glazing",8,"2027-01-22","On hold","curated",
  "On hold until the shower wall tile is chosen — the header detail changes with the tile thickness.",15),
 ("reccclo2cBAfhPFUr","Floor & wall tile","cbt","Tile",6,"2027-01-22","Not started","curated",
  "Pool-facing bath. One tile on the floor and the wet wall keeps the room reading larger.",16),
 ("recgPh28GXPGVsuuI","Vanity & mirror","pwd","Millwork",10,"2026-12-18","Not started","open",
  "Freestanding or wall-hung vanity with a mirror. This is the one room where a piece with real personality reads well — send us anything you have saved and we will confirm it fits the plumbing rough.",17),
 ("recIjIbfKF7Y40sQO","Backsplash tile","bar","Tile",6,"2027-01-08","Not started","curated",
  "Full height behind the bar run, mitered at the returns.",18),
 ("recg0ryo9S11GTVbk","Cabinet finish & counter","lnd","Millwork",10,"2026-12-18","Not started","curated",
  "Cabinet color and a durable counter over the washer and dryer.",19),
 ("rechMxoSXRseYId6p","Closet system layout & finish","clo","Closets",8,"2027-01-29","Not started","curated",
  "Hanging, drawers, shoe storage and the island. Built after drywall, but the layout drives outlets and lighting.",20),
 ("recLhaX8jzQhLUbsc","Railing design","str","Metals / railings",12,"2026-11-27","Not started","curated",
  "Picket, cable or glass at the main stair. Code sets the spacing; the rest is yours.",21),
 ("recsICQ8ojNVbgjBg","Grill & hood package","sk","Appliances",12,"2026-11-27","Not started","curated",
  "Built-in grill, vent hood, refrigeration and storage on the covered terrace. All units are 304 stainless for coastal exposure.",22),
 ("reckmhlzGsVpHrc3T","Interior finish","pool","Pool",6,"2027-02-05","Not started","curated",
  "Plaster, pebble or glass bead. This is what sets the water color.",23),
 ("recSlI2DygJvcpZZ3","Stucco texture","wh","Stucco",3,"2027-01-15","Not started","curated",
  "Finish texture on all exterior walls. We run a 4' x 4' sample board on site in your chosen texture before the crew starts.",24),
]

O = [
 ("recrFhVHLTbPJuRZd","recjpkZNCZA9sJj0x","Brushed stainless, oak rail","Savaria","Eclipse cab","SS #4 panel, white oak rail","","#B2B7BB",1),
 ("rec5o1B9vuO7KpqWV","recjpkZNCZA9sJj0x","Bronze mirror, leather rail","Savaria","Eclipse cab","Antique bronze, saddle leather","","#6A4C30",2),
 ("reckC8Bj90AmdAMDa","recjpkZNCZA9sJj0x","White lacquer, satin nickel","Savaria","Eclipse cab","Lacquer panel, nickel rail","","#E8E5DF",3),
 ("recEymDBYCgSEA7Ww","recimJy9zkarHTF8Z","Anodized bronze","PGT","WinGuard aluminum","Dark bronze anodized","","#3C2E20",1),
 ("recIzn3stqb9AawW6","recimJy9zkarHTF8Z","Architectural black","PGT","WinGuard aluminum","Matte black","","#1F2123",2),
 ("recwooz9frtN6Z9CC","recimJy9zkarHTF8Z","Satin white","PGT","WinGuard aluminum","White powder coat","","#EFEDE8",3),
 ("recVLxjxJGabcPVjU","rec8UnDcVLatisSoe","Flat slate, smoke blend","Eagle Roofing","Malibu flat","Smoke blend","","#5C6268",1),
 ("reci52yvnrh9L0LrU","rec8UnDcVLatisSoe","Barrel, sand dune","Eagle Roofing","Capistrano","Sand dune","","#C5AE8B",2),
 ("rec6DLEDnZ96D8hyt","rec8UnDcVLatisSoe","Flat slate, charcoal","Eagle Roofing","Malibu flat","Charcoal","","#33363A",3),
 ("recG0Xmth6u7EzYTl","rec8OEXhn2yG0tWGe","Rift white oak, natural","Wood-Mode","Slab door","Natural matte","","#C3A175",1),
 ("recOcu92TPOrR1duI","rec8OEXhn2yG0tWGe","Painted inset, alabaster","Wood-Mode","Inset shaker","Alabaster","","#EDE9E0",2),
 ("recvTVOBinbEkvUYn","rec8OEXhn2yG0tWGe","Walnut slab, clear","Wood-Mode","Slab door","Clear coat walnut","","#5A3C26",3),
 ("recLuQSf8SZqEcKl8","rec8OEXhn2yG0tWGe","Painted inset, deep olive","Wood-Mode","Inset shaker","Deep olive","","#454A31",4),
 ("recZUJSsf9WPzK658","rec736Xh8GVP2YteN","Polished chrome","Waterstone","Contemporary","Polished chrome","","#C3C8CC",1),
 ("recQsB846Cvwlynys","rec736Xh8GVP2YteN","Unlacquered brass","Waterstone","Contemporary","Unlacquered brass","Living finish — it darkens with use. Most owners either love that or hate it.","#B8913F",2),
 ("reciqAuxAbSu151o0","rec736Xh8GVP2YteN","Matte black","Waterstone","Contemporary","Matte black","","#232426",3),
 ("recs14jDMRyPwYukg","recDYuTvrMpNcpDPe","Brushed nickel","Waterworks",".25 series","Brushed nickel","","#B9BDC0",1),
 ("recCxULfskNBm2hm9","recDYuTvrMpNcpDPe","Unlacquered brass","Waterworks",".25 series","Unlacquered brass","","#B08C3C",2),
 ("recjuFqv8PSjfVGv8","recDYuTvrMpNcpDPe","Matte black","Waterworks",".25 series","Matte black","","#212224",3),
 ("recijNVVATxIf4Ua8","recx9Y9GYLP2SfYll","Limestone, 12x24 honed","Artistic Tile","Moleanos 12x24","Honed","","#D2CAB8",1),
 ("recU9gbCIbFULmM88","recx9Y9GYLP2SfYll","Marble hex mosaic","Artistic Tile","2\" hex","Calacatta honed","","#EAE6DE",2),
 ("rect6wMe7uXSoC2lC","recx9Y9GYLP2SfYll","Porcelain, sand matte","Florim","24x48","Sand matte","","#D9D0C0",3),
 ("recjjiHFwQwT4tOnu","recWE4cwq6GondJrQ","Marble slab, book-matched","Artistic Tile","Calacatta Gold slab","Honed","Two slabs opened like a book on the wet wall.","#EDEAE3",1),
 ("recxfUHrwYkW9JyEV","recWE4cwq6GondJrQ","Vertical stack, bone gloss","Clé Tile","3x12","Bone gloss","","#E6E0D4",2),
 ("rec8KwImakhLb3Xkc","recWE4cwq6GondJrQ","Limestone, 12x24 honed","Artistic Tile","Moleanos 12x24","Honed","Same tile as the floor option, carried up the wall.","#D2CAB8",3),
 ("recHX1vNem5tl4W6U","reclC6n7EoFYxaYKh","Flush panel, bronze","Clopay","Flush steel","Bronze","","#4C3B27",1),
 ("recBdjDvOEJZNzi9k","reclC6n7EoFYxaYKh","Full-view aluminum & frosted glass","Clopay","Avante","Clear anodized","","#BCC2C6",2),
 ("recrjyzquar8hK7lR","reclC6n7EoFYxaYKh","Wood-look composite","Clopay","Canyon Ridge","Walnut","","#5C3D26",3),
 ("recOTgfLNfSWHzwBg","recSlI2DygJvcpZZ3","Smooth sand","Site applied","20/30 silica","Hand troweled","","#E5E0D5",1),
 ("recCl5qHFKIU2NgRa","recSlI2DygJvcpZZ3","Light lace","Site applied","Knockdown lace","Medium","","#DED8CB",2),
 ("recJmUOPOKMY4ogbU","recSlI2DygJvcpZZ3","Old-world skip trowel","Site applied","Heavy skip","Hand finished","","#DCD3C1",3),
 ("recdPNdQxpSPnAwM7","reckmhlzGsVpHrc3T","White plaster","Wet Edge","Primera Stone","White","Reads bright aqua in Florida sun.","#8FC7D6",1),
 ("rec8Jg8fKz4n8Psy0","reckmhlzGsVpHrc3T","Pebble, French gray","Pebble Tec","PebbleSheen","French gray","Deeper blue-green water, and the toughest of the three underfoot.","#4E7E88",2),
 ("recDQuydrBKWKt60I","reckmhlzGsVpHrc3T","Glass bead, midnight","Pebble Tec","Beadcrete","Midnight","","#22424F",3),
 ("rectymPf5FZPDNUFf","recLhaX8jzQhLUbsc","Square picket, bronze","Local fabricator","1/2\" square picket","Oil-rubbed bronze","","#43362A",1),
 ("rec0qYAKRVKje24ho","recLhaX8jzQhLUbsc","Horizontal cable, stainless","Local fabricator","1/8\" cable","316 stainless","","#A8AEB3",2),
 ("recCZ4GbmPv7h1B8M","recLhaX8jzQhLUbsc","Frameless glass, oak cap","Local fabricator","1/2\" low-iron glass","White oak cap rail","Most open feel, and the most glass cleaning.","#D3DEE1",3),
]

opts = {}
for oid, sid, name, sup, mod, fin, note, sw, order in O:
    opts.setdefault(sid, []).append({"id":oid,"name":name,"supplier":sup,"model":mod,"finish":fin,
                                     "note":note,"link":"","swatch":sw,"photos":[],"order":order})

sels = []
for sid, item, sp, trade, lead, needed, status, mode, desc, order in S:
    row = {"id":sid,"item":item,"space":SP[sp][0],"spaceName":SP[sp][1],"trade":trade,"lead":lead,
           "needed":needed,"status":status,"mode":mode,"desc":desc,"order":order,
           "options":opts.get(sid,[]),"ownerEntry":{},"ownerPhotos":[]}
    if sid == "recsFxAAemso55BR0":
        row["ownerEntry"] = {"supplier":"Monark Premium Appliance",
            "model":'Sub-Zero 48" built-in + Wolf 48" dual fuel range',
            "finish":"Stainless, panel-ready refrigeration",
            "notes":"Adding the second dishwasher at the prep sink. Please confirm panel sizes with the cabinet shop."}
        row["submittedBy"] = "Daniel Reyes"
        row["submittedOn"] = "2026-09-09T14:41:00.000Z"
    sels.append(row)

snapshot = {
 "project":{"name":"1442 Sunset Isle Terrace (example)","code":"26-114",
   "address":"1442 Sunset Isle Terrace, Fort Lauderdale, FL 33301",
   "owners":["Marisol Reyes","Daniel Reyes"],"start":"2026-11-02","dryIn":"2027-04-16",
   "manager":"Kevin Crousillat","isExample":True},
 "spaces":[{"id":v[0],"name":v[1],"order":v[2]} for v in SP.values()],
 "selections":sels,
 "generatedAt":datetime.datetime.now().isoformat(),
}

src = open('/home/user/CKA-Customer-Portal/selections-portal.html').read()
start = src.index('var PREVIEW = {')
end = src.index('\nvar STATUS = {')
src = src[:start] + "var PREVIEW = " + json.dumps(snapshot, ensure_ascii=False, indent=1) + ";\n" + src[end:]

# Snapshot banner instead of the "two sample rows" preview wording.
src = src.replace(
 "banner = '<div class=\"banner\"><b>Preview.</b> This page is not connected to Airtable yet — ' +\n      'it is showing two sample rows so the layout can be reviewed. Set <code>API_BASE</code> in this ' +\n      'file to the deployed Worker URL and open it with <code>?p=</code> and a project\\'s portal key.</div>';",
 "banner = '<div class=\"banner\"><b>Snapshot, not live.</b> Every room, item and option below was read out of the ' +\n      'CKA Selections base in Airtable, but this copy is frozen — picking and approving here changes nothing. ' +\n      'Deploy the Worker and the same page runs against Airtable for real.</div>';")
src = src.replace(
 "foot.innerHTML = '<strong>Preview mode.</strong> Two sample rows, no Airtable connection. ' +\n      'Nothing here is saved.';",
 "foot.innerHTML = '<strong>Snapshot of the example job.</strong> Read from Airtable, frozen into this page. ' +\n      'Options have no photos attached yet, so each shows its color sample instead.';")

# Artifact form: no doctype/html/head/body wrappers.
head = re.search(r'<head>(.*?)</head>', src, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', src, re.S).group(1)
head = re.sub(r'<meta[^>]*>\s*', '', head)
open('selections-portal-artifact.html','w').write(head.strip() + "\n" + body.strip() + "\n")
print("selections:", len(sels), "options:", sum(len(v) for v in opts.values()))
