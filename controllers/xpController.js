/**
 * controllers/xpController.js
 * Handles XP calculations and level progression
 */

const { supabase } = require('../supabase');

/**
 * Add XP to user and handle level ups
 * @param {string} email - User email
 * @param {number} xpAmount - Amount of XP to add
 * @param {string} reason - Reason for XP gain (for logging)
 */
async function addXP(email, xpAmount, reason = 'unknown') {
  try {
    // Get current user data
    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('email, xp, xp_max, level')
      .eq('email', email)
      .single();

    if (getUserError) {
      console.error(`❌ Failed to get user for XP: ${email}`, getUserError);
      return null;
    }

    if (!user) {
      console.warn(`⚠️ User not found for XP: ${email}`);
      return null;
    }

    let newXP = (user.xp || 0) + xpAmount;
    let newLevel = user.level || 1;
    let newXPMax = user.xp_max || 1000;
    let leveledUp = false;

    // Check for level ups
    while (newXP >= newXPMax) {
      newXP -= newXPMax;           // Carry over remaining XP
      newLevel += 1;               // Increment level
      newXPMax += 500;             // Increase XP required for next level
      leveledUp = true;

      console.log(`🎉 ${email} leveled up to level ${newLevel}!`);
    }

    // Update user in database
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        xp: newXP,
        xp_max: newXPMax,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error(`❌ Failed to update XP for ${email}:`, updateError);
      return null;
    }

    console.log(`✅ +${xpAmount} XP to ${email} (${reason}) | Level: ${newLevel} | XP: ${newXP}/${newXPMax}`);

    return {
      email,
      xpGained: xpAmount,
      reason,
      newXP,
      newLevel,
      leveledUp,
    };
  } catch (err) {
    console.error('XP error:', err);
    return null;
  }
}

module.exports = { addXP };
