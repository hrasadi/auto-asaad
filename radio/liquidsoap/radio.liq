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

print("Scripts dir: "^script_dir)
print("Running dir: "^running_dir)
print("Media dir: "^media_dir)

start_pre_show = interactive.bool("start_pre_show", false)

def read_pre_show_filler() =
	# Get the URI
	file = list.hd(get_process_lines("cd "^script_dir^"; node ./get-preshow-filler-item.js "^current_lineup_file()))
	
	request.create(file)
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

main = audio_to_stereo(mksafe(lineup))

output.icecast(%mp3, host="localhost", port=8000, password="icecast_password", mount="raa1.ogg", main)

