import { Audio } from 'expo-av';

let soundInstance = null;

export const playBell = async () => {
  try {
    // If a sound is already playing, unload it
    if (soundInstance) {
      await soundInstance.unloadAsync();
      soundInstance = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      require('../assets/telephone-ring.wav'),
      { isLooping: true }
    );

    soundInstance = sound;
    await sound.playAsync();
    console.log('🔔 Bell is ringing...');
  } catch (err) {
    console.error('❌ Error playing bell:', err);
  }
};

export const stopBell = async () => {
  try {
    if (soundInstance) {
      await soundInstance.stopAsync();
      await soundInstance.unloadAsync();
      soundInstance = null;
      console.log('🔕 Bell stopped.');
    }
  } catch (err) {
    console.error('❌ Error stopping bell:', err);
  }
};
