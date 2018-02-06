#!/usr/bin/liquidsoap -v

# Activate the telnet server
set("server.telnet", true)
set("server.telnet.port", 1221)

script_dir = argv(1) 
running_dir = argv(2)
media_dir = argv(3)
icecast_password = argv(4)

print("Scripts dir: "^script_dir)
print("Running dir: "^running_dir)
print("Media dir: "^media_dir)

def add_skip_command(s) =
 # A command to skip
 def skip(_) =
   source.skip(s)
   "Done!"
 end
 # Register the command:
 server.register(namespace="#{source.id(s)}",
                 usage="skip",
                 description="Skip the current song.",
                 "skip",skip)
end

def get_preshow_filler() =
	# Get the URI
	file = list.hd(get_process_lines("cd "^script_dir^"; node ./get-preshow-filler-item.js "^running_dir))
	
	request.create(file)
end

def update_metadata(m) =
	filename = m["filename"]
	print("Obtaining title for #{filename}.")
	description = list.hd(get_process_lines("cd "^script_dir^"; node ./notify-clip-start.js "^running_dir^" "^media_dir^" "^filename))
	[("title","#{description}"), ("artist", "")]	
end

# Logic flow

interrupting_preshow_queue = request.queue(id = "interrupting_preshow_q")
# Attach a skip command to the source s:
add_skip_command(interrupting_preshow_queue)

interrupting_preshow_enabled = interactive.bool("interrupting_preshow_enabled", false)

interrupting_preshow_playlist = switch(track_sensitive=false, [
		(interrupting_preshow_enabled, fallback(track_sensitive=false, [
			request.equeue(id = "interrupting_preshow_q"),
			request.dynamic(id = "interrupting_preshow_filler", get_preshow_filler)]))])

interrupting_show_playlist = request.equeue(id = "interrupting_show_q")

show_playlist = request.equeue(id = "show_q")

lineup = fallback(track_sensitive=false, [
	interrupting_preshow_playlist,
	interrupting_show_playlist,
	show_playlist,
	single(media_dir^"/no-program.mp3")
])

main = mksafe(lineup)
main = map_metadata(strip=true, update_metadata, main)
main = audio_to_stereo(main)

output.icecast(%mp3(bitrate=96), host="localhost", port=8000, password=icecast_password, mount="raa1_new.ogg", icy_metadata="true", description="Radio Auto-asaad", url="http://raa.media", main)

# TODO use this code snippet to also clear the pre-show queue in addition to skipping the current song
# for better fault tolerance (although it is very rare to happen)
#def clear_queue(s) =
#        ret = server.execute("req.queue")
#        ret = list.hd(ret)
#        ret = string.split(separator=" ",ret)
#        list.iter(fun(x) -> begin foo = server.execute("req.ignore
#{x}") end,ret)
#        source.skip(s)
#end