import { Client, GatewayIntentBits, Partials } from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TrapEvent from './models/TrapEvent.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

const HONEYPOT_CHANNEL_ID = '1382101366381744148';

client.once('ready', () => {
  console.log(`🟢 Bot is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channel.id !== HONEYPOT_CHANNEL_ID) return;

  try {
    await message.delete();

    await message.guild.members.ban(message.author, {
      reason: 'Typed in honeypot channel',
    });

    // Log to MongoDB
    const event = new TrapEvent({
      userId: message.author.id,
      username: message.author.tag,
      timestamp: new Date(),
      guildId: message.guild.id,
    });
    await event.save();

    console.log(`🚨 Banned ${message.author.tag} for typing in honeypot.`);
  } catch (err) {
    console.error('❌ Error banning user:', err);
  }
});

client.login(process.env.BOT_TOKEN);
