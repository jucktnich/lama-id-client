import { config } from './helpers.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(config.supabase.url, config.supabase.key);

let user = undefined;

async function logUserInScript(id, password, ignoreCampaignStatus) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: id + '@external.users.lama-id.de',
        password: password,
    });
    if (error) {
        if (error.message === 'Invalid login credentials') {
            console.warn('Invalid login credentials');
            throw new Error('invalid-credentials');
        } else {
            console.error(error);
            throw new Error();
        }
    }

    localStorage.setItem('login', JSON.stringify({
        id: id,
        password: password
    }))

    user = data.user;
    console.log(navigator.userAgent);
    console.log('Successful login. ID is', user.id);

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*, school:school_id(*), campaigns:user_campaign(*)')
        .eq('id', user.id);
    if (userError || users.length === 0) {
        console.error(userError);
        throw new Error();
    }
    user = users[0]
    if (!user) {
        console.error('User is empty');
        throw new Error();
    }
    let campaignIDs = [];
    for (let i = 0; i < user.campaigns.length; i++) {
        campaignIDs.push(user.campaigns[i].campaign_id);
    }
    const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .in('id', campaignIDs)
        .order('priority', { ascending: false });
    if (campaignsError || campaigns.length === 0) {
        console.error(campaignsError);
        throw new Error();
    }
    user.campaign = campaigns[0];
    for (let i = 0; i < user.campaigns.length; i++) {
        if (user.campaigns[i].campaign_id === user.campaign.id) user.campaign = {...user.campaign, ...user.campaigns[i]};
    }
    const { data: userCampaign, error: userCampaignError } = await supabase
        .from('user_campaign')
        .select()
        .eq('user_id', user.id)
        .eq('campaign_id', user.campaign.id);
    if (userCampaignError) {
        console.error(userCampaignError);
        return;
    }
    if (userCampaign.length !== 1) {
        console.error('userCampaign.length !== 1');
        return;
    }
    user.user_campaign = userCampaign[0];
    const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', user.campaign.group_id);
    if (groupsError || groups.length === 0) {
        console.error(groupsError);
        throw new Error();
    }
    user.group = groups[0];
    console.log('User data fetched', user);
    if (!user.campaign.active && !ignoreCampaignStatus) {
        console.warn('Campaign is already closed')
        throw new Error('campaign-closed');
    } else {
        return;
    }
}

export { supabase, user, logUserInScript };