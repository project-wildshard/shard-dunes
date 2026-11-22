# Simulator shutdown

Jake heard game audio and asked to stop the simulators (A6). CoreAudio
showed a WebKit process in the staging QA simulator outputting audio.
That stream disappeared when the QA run shut down its simulator.

Three simulators were still booted. Ran `xcrun simctl shutdown all` and
verified the booted device list was empty.
