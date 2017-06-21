#!/usr/bin/liquidsoap -v

# Activate the telnet server
set("server.telnet",true)
set("server.telnet.port",1234)

script_dir = argv(1) 
running_dir = argv(2)
# the initial lineup file is emptry, later on, the first 'radio-planner' should annouce the lineup file using telnet 
current_lineup_file = interactive.string("current_lineup_file", "") 
media_dir = argv(3)
pre_program_filler = argv(4)

print("Scripts dir: "^script_dir)
print("Running dir: "^running_dir)
print("Media dir: "^media_dir)
print("Default filler: "^pre_program_filler)

start_pre_program = interactive.bool("start_pre_program", false)

def read_pre_program_lineup() =
	# Get the URI
	file = list.hd(get_process_lines("cd "^script_dir^"; node ./get-next-pre-program-item.js "^running_dir^"/"^current_lineup_file))
	
	request.create(file)
end

def read_program_lineup() =
	# Get the URI
	file = list.hd(get_process_lines("cd "^script_dir^"; node ./get-next-program-item.js "^running_dir^"/"^current_lineup_file))
	
	request.create(file)
end

pre_program_playlist = switch(track_sensitive=false, [
		(start_pre_adhan, fallback(track_sensitive=false, [
			request.dynamic(id = "pre_program_req", read_pre_program_lineup),
			single(media_dir^"/"^pre_program_filler)]))])


program_playlist = request.dynamic(id = "program_req", read_program_lineup)

lineup = fallback(track_sensitive=false, [
	program_playlist,
	pre_program_playlist
])

main = audio_to_stereo(mksafe(lineup))

output.icecast(%mp3, host="localhost", port=8000, password="icecast_password", mount="raa.ogg", main)

