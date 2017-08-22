#!/usr/bin/liquidsoap -v

# Activate the telnet server
set("server.telnet",true)
set("server.telnet.port",1234)

script_dir = argv(1) 
running_dir = argv(2)
media_dir = argv(3)
icecast_password = argv(4)

print("Scripts dir: "^script_dir)
print("Running dir: "^running_dir)
print("Media dir: "^media_dir)

start_pre_show = interactive.bool("start_pre_show", false)

def read_pre_show_filler() =
	# Get the URI
	file = list.hd(get_process_lines("cd "^script_dir^"; node ./get-preshow-filler-item.js "^running_dir))
	
	request.create(file)
end

def update_metadata(m) = 
	filename = m["filename"]
	if filename == "" or filename == media_dir^"/no-program.mp3" or filename == media_dir^"/blank.mp3" then
		print("Blank program. Remove title!")
		[("title","BLANK"), ("artist", "")]
	else 
		print("Obtaining title for #{filename}.")
		description = list.hd(get_process_lines("cd "^script_dir^"; node ./get-item-description.js "^running_dir^" "^filename))
		[("title","#{description}"), ("artist", "")]	
	end
end


pre_show_playlist = switch(track_sensitive=false, [
		(start_pre_show, fallback(track_sensitive=false, [
			request.equeue(id = "pre_show_q"),
			request.dynamic(id = "pre_show_filler", read_pre_show_filler)]))])


show_playlist = request.equeue(id = "show_q")

lineup = fallback(track_sensitive=false, [
	show_playlist,
	pre_show_playlist,
	single(media_dir^"/no-program.mp3")
])

main = mksafe(lineup)
main = map_metadata(strip=true, update_metadata, main)
main = audio_to_stereo(main)

output.icecast(%mp3, host="localhost", port=8000, password=icecast_password, mount="raa1.ogg", icy_metadata="true", description="Radio Auto-asaad", url="http://raa.media", main)
