#!/usr/bin/liquidsoap -v

# Activate the telnet server
set("server.telnet",true)
set("server.telnet.port",1234)

script_dir = argv(1) 
running_dir = argv(2)
# the initial lineup file is emptry, later on, the first 'radio-planner' should annouce the lineup file using telnet 
# TODO get rid of this var! This can be done by persisting this value in a file in the lineups folder!
current_lineup_file = interactive.string("current_lineup_file", "") 
media_dir = argv(3)
icecast_password = argv(4)

print("Scripts dir: "^script_dir)
print("Running dir: "^running_dir)
print("Media dir: "^media_dir)

start_pre_show = interactive.bool("start_pre_show", false)

def read_pre_show_filler() =
	# Get the URI
	file = list.hd(get_process_lines("cd "^script_dir^"; node ./get-preshow-filler-item.js "^current_lineup_file()))
	
	request.create(file)
end

def update_metadata(m) = 
	filename = m["filename"]
	description = list.hd(get_process_lines("cd "^script_dir^"; node ./get-item-description.js "^current_lineup_file()^" "^filename))
	#if description != "" then
	[("title","#{description}")]	
end

def on_blank_detected() =
	print("Blank detected! Removing the title")
	# Insert the metadata
	imeta([("title","")])
end

pre_show_playlist = switch(track_sensitive=false, [
		(start_pre_show, fallback(track_sensitive=false, [
			request.equeue(id = "pre_show_q"),
			request.dynamic(id = "pre_show_filler", read_pre_show_filler)]))])


show_playlist = request.equeue(id = "show_q")

lineup = fallback(track_sensitive=false, [
	show_playlist,
	pre_show_playlist
])

lineup = map_metadata(update_metadata, drop_metadata(lineup))

main = mksafe(lineup)

# Create a function to insert metadata
ms = insert_metadata(main)
# The function to insert metadata
imeta = fst(ms)
# The source with inserted metadata
main = snd(ms)

main = on_blank(on_blank_detected, main)
main = audio_to_stereo(main)

output.icecast(%mp3, host="localhost", port=8000, password=icecast_password, mount="raa1.ogg", icy_metadata="true", description="Radio Auto-asaad", url="http://raa.media", main)
