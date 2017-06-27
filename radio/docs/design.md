# Radio Auto-asaad Design

Before we begin, let's agree on a few terms that I will use throught these 
articles (as well as the code if you want to dig more).

## Terminology

* *Clip*: The smallest controllable peice of media, e.g. one MP3 file, live 
stream URL, etc.
* **Program**: A list of clips that will be played back-to-back. Programs may
be scheduled for a specific point in time.
* **Pre-Program**: Suppose you have a news program scheduled for 2:00pm. What 
if you want to play some music up before the program starts but you care 
for the program to start on-time and not be delayed if the playlist takes 
longer and passes the start time. The idea is to have another list of items
we want to play before a program but have lower priority from the main program
if it is scheduled for a specific time.
* **Lineup**: Lineup is a set of programs (along with their pre-program shows)
that will be played by the lineup manager. Note that maximum length of a lineup
is one day and each lineups file is dedicated to one day of program.

## 
