// Verified local cropped portraits & Wikimedia Commons portraits for Uttar Pradesh leaders.
// Keys are normalized lowercase names via normalizeLeaderKey().

export function normalizeLeaderKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(dr\.?|shri|smt\.?|thakur|kunwar|chaudhary|prof\.?|mr\.?|mrs\.?)\s+/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const KNOWN_LEADER_PHOTOS: Record<string, string> = {
  // 11 Party Leaders (local crisp portraits from attached UP 2027 montage)
  'yogi adityanath': './assets/leaders/bjp.jpg',
  'adityanath yogi': './assets/leaders/bjp.jpg',
  'akhilesh yadav': './assets/leaders/sp.jpg',
  mayawati: './assets/leaders/bsp.jpg',
  'mayawati kumari': './assets/leaders/bsp.jpg',
  'rahul gandhi': './assets/leaders/inc.jpg',
  'jayant chaudhary': './assets/leaders/rld.jpg',
  'jayant singh': './assets/leaders/rld.jpg',
  'anupriya patel': './assets/leaders/ad.jpg',
  'sanjay nishad': './assets/leaders/nishad.jpg',
  'om prakash rajbhar': './assets/leaders/sbsp.jpg',
  'o p rajbhar': './assets/leaders/sbsp.jpg',
  'asaduddin owaisi': './assets/leaders/aimim.jpg',
  'chandrashekhar azad': './assets/leaders/asp.jpg',
  'chandra shekhar azad': './assets/leaders/asp.jpg',
  'chandrashekhar azad ravan': './assets/leaders/asp.jpg',
  'raghuraj pratap singh': './assets/aistudio/images__3__4371317e.jpeg',
  'raja bhaiya': './assets/aistudio/images__3__4371317e.jpeg',

  // Verified Wikimedia Commons / Wikipedia Portraits for UP Constituency Leaders
  'keshav prasad maurya':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/80/Shri_Keshav_Prasad_Maurya%2C_MP%2C_Phoolpur_%28U.P%29_and_Shri_Satyapal_Singh_Saini%2C_MP%2C_Sambhal_%28U.P%29_meeting_the_Minister_of_State_for_Culture_%28Independent_Charge%29%2C_Tourism_%28Independent_Charge%29_and_Civil_Aviation_%28cropped%29.jpg/250px-thumbnail.jpg',
  'brajesh pathak':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Brajesh_Pathak.jpg/250px-Brajesh_Pathak.jpg',
  'shivpal singh yadav':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Shivpal_singh_Yadav.png/250px-Shivpal_singh_Yadav.png',
  'swami prasad maurya':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Swami_Prasad_Maurya.jpg/250px-Swami_Prasad_Maurya.jpg',
  'suresh kumar khanna':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/The_Minister_of_Urban_Development%2C_Uttar_Pradesh%2C_Shri_Suresh_Khanna_meeting_the_Union_Minister_for_Water_Resources%2C_River_Development_and_Ganga_Rejuvenation%2C_Sushri_Uma_Bharti%2C_in_New_Delhi_on_June_21%2C_2017.jpg/250px-thumbnail.jpg',
  'suresh khanna':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/The_Minister_of_Urban_Development%2C_Uttar_Pradesh%2C_Shri_Suresh_Khanna_meeting_the_Union_Minister_for_Water_Resources%2C_River_Development_and_Ganga_Rejuvenation%2C_Sushri_Uma_Bharti%2C_in_New_Delhi_on_June_21%2C_2017.jpg/250px-thumbnail.jpg',
  'kalraj mishra':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Shri_Kalraj_Mishra%2C_44th_Governer_of_Rajasthan.png/250px-Shri_Kalraj_Mishra%2C_44th_Governer_of_Rajasthan.png',
  'mahesh sharma':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/Dr._Mahesh_Sharma_taking_charge_as_the_Minister_of_State_for_%28Independent_Charge%29_Tourism%2C_in_New_Delhi_on_November_12%2C_2014_%28cropped%29.jpg/250px-Dr._Mahesh_Sharma_taking_charge_as_the_Minister_of_State_for_%28Independent_Charge%29_Tourism%2C_in_New_Delhi_on_November_12%2C_2014_%28cropped%29.jpg',
  's p singh baghel':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/SPS_Baghel_MoS_Health.jpg/250px-SPS_Baghel_MoS_Health.jpg',
  'pankaj singh':
    'https://upload.wikimedia.org/wikipedia/commons/e/eb/Pankaj_Singh_-_politician.jpg',
  'imran masood':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Imran_Masood.jpg/250px-Imran_Masood.jpg',
  'dharam singh saini':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Dr.dharam_singh_saini_saharanpur.jpg/250px-Dr.dharam_singh_saini_saharanpur.jpg',
  'rajendra singh rana':
    'https://upload.wikimedia.org/wikipedia/commons/1/11/Rajendra-singh-rana-sm.jpg',
  'nawab singh nagar':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Nawab_Singh_Nagar.jpg/250px-Nawab_Singh_Nagar.jpg',
  'brijesh singh':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Brijeshsinghmla.jpg/250px-Brijeshsinghmla.jpg',
  'ashu malik':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Ashu_Malik.png/250px-Ashu_Malik.png',
  'tej narayan pandey':
    'https://thumb.wikimedia.org/wikipedia/en/thumb/4/42/Tej_Narayan_Pandey.jpg/250px-Tej_Narayan_Pandey.jpg',
  'jaivir singh':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Thakur_Jaivir_Singh_official_portrait.png/250px-Thakur_Jaivir_Singh_official_portrait.png',
  'rakesh pratap':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Rpsmlagauriganj.webp/250px-Rpsmlagauriganj.webp',
  'rakesh pratap singh':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Rpsmlagauriganj.webp/250px-Rpsmlagauriganj.webp',
  'naresh saini':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Naresh_Saini.png/250px-Naresh_Saini.png',
  'dayashankar mishra':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Dr._Dayashankar_Mishra_Dayalu.jpg/250px-Dr._Dayashankar_Mishra_Dayalu.jpg',
  'dayashankar mishra dayalu':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Dr._Dayashankar_Mishra_Dayalu.jpg/250px-Dr._Dayashankar_Mishra_Dayalu.jpg',
  'azam khan':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Mohammad_Azam_Khan_1.jpg/250px-Mohammad_Azam_Khan_1.jpg',
  'atul garg':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Atul_Kumar_Garg.jpg/250px-Atul_Kumar_Garg.jpg',
  'atul kumar garg':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Atul_Kumar_Garg.jpg/250px-Atul_Kumar_Garg.jpg',
  'sidharth nath singh':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/Siddharth_Nath_Singh.jpg/250px-Siddharth_Nath_Singh.jpg',
  'siddharth nath singh':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/Siddharth_Nath_Singh.jpg/250px-Siddharth_Nath_Singh.jpg',
  'swatantra dev singh':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Hasnain_baqai_with_Swatantra_dev_singh_bjp_president_and_minister_of_Uttar_pradesh.jpg/250px-Hasnain_baqai_with_Swatantra_dev_singh_bjp_president_and_minister_of_Uttar_pradesh.jpg',
  'manoj chaudhary':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/HE_IS_MANOJ_CHAUDHARY_WHO_SERVERS_HIMSELF_AS_DISTRICT_PRESIDENT_OF_RLD_IN_DISTRICTS.png/250px-HE_IS_MANOJ_CHAUDHARY_WHO_SERVERS_HIMSELF_AS_DISTRICT_PRESIDENT_OF_RLD_IN_DISTRICTS.png',
  'rajnath singh':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Rajnath_Singh_at_Bishkek.jpg/250px-Rajnath_Singh_at_Bishkek.jpg',
  'smriti irani':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Smriti_Irani_as_Minister_of_Minority_Affairs.jpg/250px-Smriti_Irani_as_Minister_of_Minority_Affairs.jpg',
  'priyanka gandhi':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Priyanka_Gandhi_Vadra_%287%29.jpg/250px-Priyanka_Gandhi_Vadra_%287%29.jpg',
  'dimple yadav':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/DimpleMP.jpg/250px-DimpleMP.jpg',
  'hema malini':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Hema_Malini%27s_75th_birthday_celebration.jpg/250px-Hema_Malini%27s_75th_birthday_celebration.jpg',
  'maneka gandhi':
    'https://upload.wikimedia.org/wikipedia/commons/a/a4/Maneka-Gandhi.jpg',
  'varun gandhi':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Varungandhipilibhit_%28cropped%29.jpg/250px-Varungandhipilibhit_%28cropped%29.jpg',
  'ravi kishan':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Ravi_Kissen_at_the_launch_of_T_P_Aggarwal%27s_trade_magazine_%27Blockbuster%27_20.jpg/250px-Ravi_Kissen_at_the_launch_of_T_P_Aggarwal%27s_trade_magazine_%27Blockbuster%27_20.jpg',
  'dinesh lal yadav':
    'https://upload.wikimedia.org/wikipedia/commons/e/e3/Dinesh_Lal_Yadav_at_Press_Conference_of_Celebrity_Cricket_League_2016_%28cropped%29.jpg',
  'narendra modi':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/The_official_portrait_of_Shri_Narendra_Modi%2C_the_Prime_Minister_of_the_Republic_of_India.jpg/250px-The_official_portrait_of_Shri_Narendra_Modi%2C_the_Prime_Minister_of_the_Republic_of_India.jpg',
};
