import { AppLanguage } from '../types/election';

export interface TranslationCopy {
  brandSub: string;
  nav: {
    home: string;
    parties: string;
    alliances: string;
    constituencies: string;
    leaderboard: string;
    admin: string;
  };
  headers: {
    home: string;
    parties: string;
    alliances: string;
    constituencies: string;
    leaderboard: string;
    admin: string;
  };
  auth: {
    signIn: string;
    continueGoogle: string;
    continuePhone: string;
    signingInGoogle: string;
    authModalTitle: string;
    authModalSub: string;
    mobileLabel: string;
    mobilePlaceholder: string;
    nameOptionalLabel: string;
    nameOptionalPlaceholder: string;
    sendOtp: string;
    sendingOtp: string;
    enterOtpLabel: string;
    verifyOtp: string;
    verifyingOtp: string;
    otpSentTo: (phone: string) => string;
    changeNumber: string;
    resendOtp: string;
    resendIn: (sec: number) => string;
    orDivider: string;
    account: string;
    freeTierMember: string;
    guestCitizen: string;
    syncedCloud: string;
    syncingCloud: string;
    localDraft: string;
  };
  home: {
    blackoutTitle: string;
    tagline: string;
    splashDesc: string;
    termsPrivacy: string;
    civicTiers: string;
    civicTiersDesc: string;
    splashMeta: string;
    civicPoints: string;
    completed: string;
    untilLock: string;
    locked: string;
    forecastTag: string;
    heroTitle: string;
    heroDesc: string;
    predictSeatsNow: string;
    browse403Seats: string;
    currentAllocationTitle: string;
    allocationSub: (completed: number) => string;
    adjustBands: string;
    quickAccess: string;
    districtsSub: string;
    quickPartySeats: string;
    quickAlliances: string;
    quickSeats403: string;
    quickRankings: string;
    quickSummary: string;
    footerNotice: string;
    legalScoringBtn: string;
  };
  rewards: {
    badgeFree: string;
    title: string;
    headline: string;
    desc: string;
    prizeAmount: string;
    prizeSub: string;
    ctaPredict: string;
    ctaLeaderboard: string;
  };
  parties: {
    predictLabel: string;
    histTitle: (year: string) => string;
    predictTitle: string;
    histSub: string;
    predictSub: string;
    historicalChip: string;
    bandChip: string;
    allocatedLabel: string;
    totalSeatsLabel: string;
    majorityLabel: string;
    exactBalanced: string;
    unallocatedCount: (n: number) => string;
    overCount: (n: number) => string;
    tapPartyStep: string;
    autoBalance: string;
    reset: string;
    bandOf5: string;
    allocatedSeatsSub: (seats: number, won2022: number) => string;
    showAllBands: string;
    hideAllBands: string;
    overWarning: (total: number) => string;
    totalAllocatedPrefix: string;
    saveCloud: string;
    savingCloud: string;
    signInSave: string;
    perfTitle: (year: string) => string;
    predict2027Btn: string;
    seatShare: (pct: number) => string;
  };
  alliances: {
    predictLabel: string;
    histTitle: (year: string) => string;
    predictTitle: string;
    histSub: string;
    predictSub: string;
    historicalChip: string;
    bandChip: string;
    allocatedLabel: string;
    totalSeatsLabel: string;
    majorityLabel: string;
    exactBalanced: string;
    unallocatedCount: (n: number) => string;
    overCount: (n: number) => string;
    tapAllianceStep: string;
    syncFromParties: string;
    autoBalance: string;
    reset: string;
    bandOf5: string;
    allocatedSeatsSub: (seats: number, won2022: number) => string;
    showAllBands: string;
    hideAllBands: string;
    overWarning: (total: number) => string;
    totalAllocatedPrefix: string;
    saveCloud: string;
    savingCloud: string;
    signInSave: string;
    perfTitle: (year: string) => string;
    predict2027Btn: string;
    seatShare: (pct: number) => string;
    constituentsLabel: string;
    partySumHint: (n: number) => string;
  };
  constituencies: {
    title: string;
    subtitle: string;
    predictedChip: (count: number) => string;
    searchPlaceholder: string;
    allDistricts: string;
    allLabel: (n: number) => string;
    myPicksLabel: (n: number) => string;
    pendingLabel: (n: number) => string;
    noMatches: string;
    noMatchesSub: string;
    predictBtn: string;
    nextSeat: string;
    histSection: string;
    winnerLabel: (yr: string) => string;
    runnerUpLabel: (yr: string) => string;
    votesSuffix: string;
    refTally: string;
    whoWillWin: string;
    pickedLabel: string;
    selectedLabel: string;
    selectLabel: string;
    officialListAwaited: string;
    officialListDesc: string;
    customNamePlaceholder: string;
    savePickBtn: string;
  };
  leaderboard: {
    tabLeaderboard: string;
    tabSummary: string;
    openBoardTitle: string;
    openBoardSub: string;
    scoringRulesBtn: string;
    scoringTitle: string;
    ruleConstituency: string;
    rulePartyBand: string;
    ruleCompletion: string;
    rulePreCount: string;
    rulePools: string;
    emptyOpenBoard: string;
    publicAliasActive: string;
    hiddenFromBoard: string;
    footerNote: string;
    constituencyProgress: string;
    seatsRemaining: (n: number) => string;
    predictionCutoff: string;
    countingDayLabel: string;
    cloudSyncStatus: string;
    submitted: string;
    draftSynced: string;
    partyForecast: string;
    editBands: string;
    updateForecast: string;
    submitForecast: string;
    yourPicksTitle: (n: number) => string;
    editableUntil: string;
    pickMoreSeats: string;
    filterPicksPlaceholder: string;
    noPicksTitle: string;
    noPicksSub: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, TranslationCopy> = {
  en: {
    brandSub: 'Your View. Every Constituency.',
    nav: {
      home: 'Home',
      parties: 'Party Seats',
      alliances: 'Alliances',
      constituencies: 'Constituencies',
      leaderboard: 'Leaderboard',
      admin: 'Admin',
    },
    headers: {
      home: 'UP Mandate',
      parties: 'Party Seat Prediction',
      alliances: 'Alliance Prediction',
      constituencies: 'Constituencies (403)',
      leaderboard: 'Leaderboard & Summary',
      admin: 'Admin Console',
    },
    auth: {
      signIn: 'Sign In',
      continueGoogle: 'Continue with Google',
      continuePhone: 'Login / Sign Up with Mobile OTP',
      signingInGoogle: 'Connecting Google...',
      authModalTitle: 'Sign In or Create Account',
      authModalSub: 'Free UP 2027 forecasting · Synced on Web & Mobile',
      mobileLabel: 'Mobile Number',
      mobilePlaceholder: '10-digit mobile number',
      nameOptionalLabel: 'Your Name / Public Alias (optional)',
      nameOptionalPlaceholder: 'e.g. Lucknow Forecaster',
      sendOtp: 'Send Verification OTP',
      sendingOtp: 'Sending OTP...',
      enterOtpLabel: 'Enter 6-Digit SMS OTP',
      verifyOtp: 'Verify OTP & Sign In',
      verifyingOtp: 'Verifying OTP...',
      otpSentTo: (phone) => `6-digit OTP sent via SMS to ${phone}`,
      changeNumber: 'Change Number',
      resendOtp: 'Resend OTP',
      resendIn: (sec) => `Resend in ${sec}s`,
      orDivider: 'or',
      account: 'Account',
      freeTierMember: 'Free Civic Member',
      guestCitizen: 'Guest Citizen',
      syncedCloud: 'Synced with Firebase Cloud',
      syncingCloud: 'Syncing to Firebase Cloud...',
      localDraft: 'Local draft · Sign in to cloud sync',
    },
    home: {
      blackoutTitle: 'Statutory Election Silence Period Active',
      tagline: 'Your View. Every Constituency.',
      splashDesc:
        "Forecast Uttar Pradesh's 403 Assembly seats by party bands, alliances, and constituency winners — 100% free. Sign in with Mobile Number + OTP or Google to compete for prizes & gifts worth ₹50 Lakhs.",
      termsPrivacy: 'Terms & Privacy Policy',
      civicTiers: '100% Free Civic Forecasting',
      civicTiersDesc:
        'Zero entry fee for every citizen. Top leaderboard forecasters win exciting prizes and gifts worth ₹50 Lakhs.',
      splashMeta: 'Free Entry · ₹50 Lakh Prizes & Gifts · 403 Seats',
      civicPoints: 'Civic Points',
      completed: 'Completed',
      untilLock: 'Until 7 AM Lock',
      locked: 'Locked',
      forecastTag: '2027 Assembly Forecast',
      heroTitle: 'Uttar Pradesh Assembly Elections',
      heroDesc:
        'Your Opinion Matters! Allocate all 403 seats in 5-seat bands and select constituency winners before the 7:00 AM IST counting-day lock.',
      predictSeatsNow: 'Predict Seats Now',
      browse403Seats: 'Browse 403 Seats',
      currentAllocationTitle: 'Your Current 2027 Seat Allocation',
      allocationSub: (completed) => `5-seat forecast bands · ${completed}/403 seats picked`,
      adjustBands: 'Adjust Party Seat Bands →',
      quickAccess: 'Quick Access',
      districtsSub: '403 Constituencies · 75 Districts',
      quickPartySeats: 'Party Seats',
      quickAlliances: 'Alliances',
      quickSeats403: 'Seats (403)',
      quickRankings: 'Rankings',
      quickSummary: 'Summary',
      footerNotice:
        '100% free civic opinion & forecasting platform. Predictions reflect user opinion, not official ECI results. Winners earn prizes & gifts worth ₹50 Lakhs.',
      legalScoringBtn: 'Legal & Scoring Rules',
    },
    rewards: {
      badgeFree: '100% FREE TIER',
      title: 'Win Prizes & Gifts Worth ₹50 Lakhs',
      headline: 'Free Entry for Every UP Forecaster',
      desc: 'No payment or subscription required. Predict 403 Assembly seats, party ranges, and alliances accurately to rank at the top and win prizes & gifts worth ₹50 Lakhs.',
      prizeAmount: '₹50 Lakhs',
      prizeSub: 'Winner Prizes & Gifts Pool',
      ctaPredict: 'Start Free Prediction',
      ctaLeaderboard: 'View Leaderboard',
    },
    parties: {
      predictLabel: 'Predict',
      histTitle: (year) => `${year} UP Assembly Result`,
      predictTitle: 'Allocate 403 Seats across Parties',
      histSub: 'Verified historical seat tally · Majority mark: 202 seats',
      predictSub: 'Tap any chart slice or party card below to adjust its 5-seat band',
      historicalChip: 'Historical',
      bandChip: '5-Seat Bands',
      allocatedLabel: 'Allocated',
      totalSeatsLabel: 'Total Seats',
      majorityLabel: 'UP Assembly Majority Mark:',
      exactBalanced: 'Exact 403 balanced',
      unallocatedCount: (n) => `${n} seats unallocated`,
      overCount: (n) => `${n} seats over 403`,
      tapPartyStep: '1. Tap a Political Party',
      autoBalance: 'Auto-Balance 403',
      reset: 'Reset',
      bandOf5: 'Band of 5',
      allocatedSeatsSub: (seats, won2022) => `Allocated: ${seats} seats · 2022 won: ${won2022}`,
      showAllBands: 'Quick Pick from All 81 Seat Bands (5-Seat Steps)',
      hideAllBands: 'Hide All 81 Seat Bands',
      overWarning: (total) =>
        `Allocated (${total}) exceeds 403 UP seats. Tap "Auto-Balance 403" or adjust bands.`,
      totalAllocatedPrefix: 'Total Allocated:',
      saveCloud: 'Save Forecast to Firebase',
      savingCloud: 'Saving to Cloud...',
      signInSave: 'Sign In to Save to Cloud',
      perfTitle: (year) => `${year} Election Party Performance`,
      predict2027Btn: 'Predict 2027 Now →',
      seatShare: (pct) => `Seat share: ${pct}%`,
    },
    alliances: {
      predictLabel: 'Predict',
      histTitle: (year) => `${year} UP Alliance Tally`,
      predictTitle: 'Allocate 403 Seats across Alliances',
      histSub: 'Combined bloc historical tally · Majority mark: 202 seats',
      predictSub: 'Tap any chart slice or alliance card below to forecast 5-seat coalition bands',
      historicalChip: 'Historical',
      bandChip: '5-Seat Bands',
      allocatedLabel: 'Allocated',
      totalSeatsLabel: 'Total Seats',
      majorityLabel: 'UP Assembly Majority Mark:',
      exactBalanced: 'Exact 403 balanced',
      unallocatedCount: (n) => `${n} seats unallocated`,
      overCount: (n) => `${n} seats over 403`,
      tapAllianceStep: '1. Tap a Political Alliance / Front',
      syncFromParties: 'Sync from Party Seats',
      autoBalance: 'Auto-Balance 403',
      reset: 'Reset',
      bandOf5: 'Band of 5',
      allocatedSeatsSub: (seats, won2022) => `Allocated: ${seats} seats · 2022 bloc tally: ${won2022}`,
      showAllBands: 'Quick Pick from All 81 Seat Bands (5-Seat Steps)',
      hideAllBands: 'Hide All 81 Seat Bands',
      overWarning: (total) =>
        `Allocated (${total}) exceeds 403 UP seats. Tap "Auto-Balance 403" or adjust bands.`,
      totalAllocatedPrefix: 'Total Alliance Seats:',
      saveCloud: 'Save Alliance Forecast to Firebase',
      savingCloud: 'Saving to Cloud...',
      signInSave: 'Sign In to Save to Cloud',
      perfTitle: (year) => `${year} Bloc & Alliance Breakdown`,
      predict2027Btn: 'Predict 2027 Alliances →',
      seatShare: (pct) => `Bloc share: ${pct}%`,
      constituentsLabel: 'Constituents:',
      partySumHint: (n) => `From Party Seats sum: ${n}`,
    },
    constituencies: {
      title: '403 Assembly Seats',
      subtitle: 'Tap any seat to review 2007–2022 results and pick your 2027 winner',
      predictedChip: (count) => `${count} / 403 Predicted`,
      searchPlaceholder: 'Search AC No. (1–403), Seat, District or Candidate...',
      allDistricts: 'All 75 Districts',
      allLabel: (n) => `All (${n})`,
      myPicksLabel: (n) => `My Picks (${n})`,
      pendingLabel: (n) => `Pending (${n})`,
      noMatches: 'No matching constituencies found',
      noMatchesSub: 'Try clearing your search or switching district filters.',
      predictBtn: 'Predict',
      nextSeat: 'Next Seat →',
      histSection: 'Historical Election Results',
      winnerLabel: (yr) => `${yr} Winner`,
      runnerUpLabel: (yr) => `${yr} Runner-up`,
      votesSuffix: 'votes',
      refTally: 'Reference tally',
      whoWillWin: 'Who do you predict will win this constituency?',
      pickedLabel: 'Picked:',
      selectedLabel: 'Selected',
      selectLabel: 'Select',
      officialListAwaited: 'Official candidate list awaited.',
      officialListDesc:
        'Other 2027 candidates will appear automatically when officially announced. You may also forecast a winning party below:',
      customNamePlaceholder: 'Optional candidate name...',
      savePickBtn: 'Save Pick',
    },
    leaderboard: {
      tabLeaderboard: 'Leaderboard',
      tabSummary: 'My Summary',
      openBoardTitle: 'UP Mandate Civic Forecasters',
      openBoardSub: '100% Free Entry · Winners Earn Prizes & Gifts Worth ₹50 Lakhs',
      scoringRulesBtn: 'Scoring & Prize Rules',
      scoringTitle: 'Transparent Scoring Methodology',
      ruleConstituency: 'Correct constituency winner (after verified ECI results): 10 points each',
      rulePartyBand: 'Correct party 5-seat forecast band: 100 points each',
      ruleCompletion: 'Full 403-seat completion bonus: 50 points',
      rulePreCount:
        'Current pre-counting Civic Points reflect prediction completion & party balance progress.',
      rulePools:
        '100% Free Tier — Top-ranked forecasters win prizes & gifts worth ₹50 Lakhs upon verified ECI declaration.',
      emptyOpenBoard:
        'Sign in with Mobile OTP or Google and opt into the leaderboard to compete for prizes & gifts worth ₹50 Lakhs.',
      publicAliasActive: 'Public Alias Active',
      hiddenFromBoard: 'Hidden from Public Leaderboard (Profile Settings)',
      footerNote:
        'Final accuracy points update automatically after verified ECI counting results. 100% Free Entry · ₹50 Lakh Prizes & Gifts.',
      constituencyProgress: 'Constituency Progress',
      seatsRemaining: (n) => `${n} seats remaining`,
      predictionCutoff: 'Prediction Cutoff',
      countingDayLabel: '7:00 AM IST Counting Day',
      cloudSyncStatus: 'Cloud Sync Status',
      submitted: 'Submitted',
      draftSynced: 'Draft Synced',
      partyForecast: 'Party Seat Forecast',
      editBands: 'Edit Bands',
      updateForecast: 'Update Submitted Forecast',
      submitForecast: 'Confirm & Submit Forecast',
      yourPicksTitle: (n) => `Your Constituency Picks (${n})`,
      editableUntil: 'Editable until 7:00 AM IST on counting date',
      pickMoreSeats: 'Pick More Seats →',
      filterPicksPlaceholder: 'Filter your saved picks by AC No., seat, candidate or party...',
      noPicksTitle: 'No constituency predictions saved yet',
      noPicksSub: "Open the Constituencies tab to pick winners across Uttar Pradesh's 403 seats.",
    },
  },
  hi: {
    brandSub: 'आपका मत। हर विधानसभा।',
    nav: {
      home: 'होम',
      parties: 'पार्टी सीटें',
      alliances: 'गठबंधन',
      constituencies: 'विधानसभा',
      leaderboard: 'लीडरबोर्ड',
      admin: 'एडमिन',
    },
    headers: {
      home: 'UP Mandate',
      parties: 'पार्टी सीट पूर्वानुमान',
      alliances: 'गठबंधन सीट पूर्वानुमान',
      constituencies: 'विधानसभा क्षेत्र (403)',
      leaderboard: 'लीडरबोर्ड व सारांश',
      admin: 'एडमिन कंसोल',
    },
    auth: {
      signIn: 'लॉगिन करें',
      continueGoogle: 'Google से लॉगिन करें',
      continuePhone: 'मोबाइल OTP से लॉगिन / साइन अप',
      signingInGoogle: 'Google से जुड़ रहा है...',
      authModalTitle: 'लॉगिन या नया खाता बनाएं',
      authModalSub: 'निःशुल्क यूपी 2027 पूर्वानुमान · वेब व मोबाइल सिंक',
      mobileLabel: 'मोबाइल नंबर',
      mobilePlaceholder: '10-अंकीय मोबाइल नंबर',
      nameOptionalLabel: 'आपका नाम / उपनाम (वैकल्पिक)',
      nameOptionalPlaceholder: 'जैसे: लखनऊ विश्लेषक',
      sendOtp: 'OTP भेजें',
      sendingOtp: 'OTP भेजा जा रहा है...',
      enterOtpLabel: 'SMS में प्राप्त 6-अंकीय OTP दर्ज करें',
      verifyOtp: 'OTP सत्यापित करें व लॉगिन',
      verifyingOtp: 'सत्यापन हो रहा है...',
      otpSentTo: (phone) => `${phone} पर SMS द्वारा 6-अंकीय OTP भेजा गया है`,
      changeNumber: 'नंबर बदलें',
      resendOtp: 'OTP पुनः भेजें',
      resendIn: (sec) => `${sec} सेकंड में पुनः भेजें`,
      orDivider: 'या',
      account: 'खाता',
      freeTierMember: 'निःशुल्क सदस्य',
      guestCitizen: 'अतिथि नागरिक',
      syncedCloud: 'Firebase क्लाउड से सिंक',
      syncingCloud: 'Firebase क्लाउड में सिंक हो रहा है...',
      localDraft: 'लोकल ड्राफ्ट · क्लाउड सिंक के लिए लॉगिन करें',
    },
    home: {
      blackoutTitle: 'वैधानिक चुनाव मौन अवधि लागू है',
      tagline: 'आपका मत। हर विधानसभा।',
      splashDesc:
        'उत्तर प्रदेश की 403 विधानसभा सीटों, पार्टी और गठबंधन का 100% निःशुल्क पूर्वानुमान लगाएं। ₹50 लाख के पुरस्कार व उपहार जीतने के लिए मोबाइल OTP या Google से साइन इन करें।',
      termsPrivacy: 'नियम एवं गोपनीयता नीति',
      civicTiers: '100% निःशुल्क नागरिक पूर्वानुमान',
      civicTiersDesc:
        'सभी नागरिकों के लिए पूर्णतः निःशुल्क। शीर्ष रैंक वाले विजेताओं को ₹50 लाख मूल्य के पुरस्कार और उपहार मिलेंगे।',
      splashMeta: 'निःशुल्क प्रवेश · ₹50 लाख पुरस्कार व उपहार · 403 सीटें',
      civicPoints: 'नागरिक अंक',
      completed: 'पूर्ण',
      untilLock: 'सुबह 7 बजे लॉक तक',
      locked: 'लॉक',
      forecastTag: '2027 विधानसभा पूर्वानुमान',
      heroTitle: 'उत्तर प्रदेश विधानसभा चुनाव',
      heroDesc:
        'आपकी राय मायने रखती है! मतगणना के दिन सुबह 7:00 बजे IST से पहले सभी 403 सीटें 5-सीट रेंज में आवंटित करें और विजेता चुनें।',
      predictSeatsNow: 'अभी सीटें चुनें',
      browse403Seats: '403 सीटें देखें',
      currentAllocationTitle: 'आपका वर्तमान 2027 सीट आवंटन',
      allocationSub: (completed) => `5-सीट पूर्वानुमान रेंज · ${completed}/403 सीटें चुनी गईं`,
      adjustBands: 'पार्टी सीट रेंज बदलें →',
      quickAccess: 'त्वरित पहुँच',
      districtsSub: '403 विधानसभा क्षेत्र · 75 जिले',
      quickPartySeats: 'पार्टी सीटें',
      quickAlliances: 'गठबंधन',
      quickSeats403: 'सीटें (403)',
      quickRankings: 'रैंकिंग',
      quickSummary: 'सारांश',
      footerNotice:
        '100% निःशुल्क स्वतंत्र नागरिक पूर्वानुमान मंच। यह ECI का आधिकारिक परिणाम नहीं है। विजेताओं को ₹50 लाख के पुरस्कार व उपहार।',
      legalScoringBtn: 'कानूनी व अंक नियम',
    },
    rewards: {
      badgeFree: '100% निःशुल्क श्रेणी',
      title: '₹50 लाख मूल्य के पुरस्कार और उपहार जीतें',
      headline: 'हर यूपी विश्लेषक के लिए पूर्णतः निःशुल्क प्रवेश',
      desc: 'कोई शुल्क या सदस्यता आवश्यक नहीं है। 403 विधानसभा सीटों, पार्टी रेंज और गठबंधन का सटीक अनुमान लगाएं और ₹50 लाख के पुरस्कार व उपहार जीतें।',
      prizeAmount: '₹50 लाख',
      prizeSub: 'विजेता पुरस्कार व उपहार पूल',
      ctaPredict: 'निःशुल्क पूर्वानुमान शुरू करें',
      ctaLeaderboard: 'लीडरबोर्ड देखें',
    },
    parties: {
      predictLabel: 'चुनें',
      histTitle: (year) => `${year} यूपी विधानसभा परिणाम`,
      predictTitle: 'सभी दलों में 403 सीटें आवंटित करें',
      histSub: 'सत्यापित ऐतिहासिक परिणाम · बहुमत आंकड़ा: 202 सीटें',
      predictSub: '5-सीट रेंज बदलने के लिए चार्ट या पार्टी कार्ड पर टैप करें',
      historicalChip: 'ऐतिहासिक',
      bandChip: '5-सीट रेंज',
      allocatedLabel: 'आवंटित',
      totalSeatsLabel: 'कुल सीटें',
      majorityLabel: 'बहुमत का आंकड़ा:',
      exactBalanced: 'पूर्ण 403 संतुलित',
      unallocatedCount: (n) => `${n} सीटें शेष हैं`,
      overCount: (n) => `403 से ${n} सीटें अधिक`,
      tapPartyStep: '1. राजनीतिक दल चुनें',
      autoBalance: '403 संतुलित करें',
      reset: 'रीसेट',
      bandOf5: '5 सीटों की रेंज',
      allocatedSeatsSub: (seats, won2022) => `आवंटित: ${seats} सीटें · 2022 में जीतीं: ${won2022}`,
      showAllBands: 'सभी 81 रेंज (5-सीट अंतराल) में से चुनें',
      hideAllBands: 'सभी 81 सीट रेंज छिपाएं',
      overWarning: (total) =>
        `आवंटित (${total}) 403 सीटों से अधिक है। "403 संतुलित करें" दबाएं या रेंज कम करें।`,
      totalAllocatedPrefix: 'कुल आवंटित:',
      saveCloud: 'Firebase में सहेजें',
      savingCloud: 'सहेजा जा रहा है...',
      signInSave: 'सहेजने के लिए लॉगिन करें',
      perfTitle: (year) => `${year} चुनाव दल प्रदर्शन`,
      predict2027Btn: '2027 का अनुमान लगाएं →',
      seatShare: (pct) => `सीट प्रतिशत: ${pct}%`,
    },
    alliances: {
      predictLabel: 'चुनें',
      histTitle: (year) => `${year} यूपी गठबंधन परिणाम`,
      predictTitle: 'गठबंधनों में 403 सीटें आवंटित करें',
      histSub: 'गठबंधनवार ऐतिहासिक आंकड़ा · बहुमत आंकड़ा: 202 सीटें',
      predictSub: '5-सीट रेंज बदलने के लिए चार्ट या नीचे दिए गठबंधन कार्ड पर टैप करें',
      historicalChip: 'ऐतिहासिक',
      bandChip: '5-सीट रेंज',
      allocatedLabel: 'आवंटित',
      totalSeatsLabel: 'कुल सीटें',
      majorityLabel: 'बहुमत का आंकड़ा:',
      exactBalanced: 'पूर्ण 403 संतुलित',
      unallocatedCount: (n) => `${n} सीटें शेष हैं`,
      overCount: (n) => `403 से ${n} सीटें अधिक`,
      tapAllianceStep: '1. राजनीतिक गठबंधन / मोर्चा चुनें',
      syncFromParties: 'पार्टी सीटों से सिंक करें',
      autoBalance: '403 संतुलित करें',
      reset: 'रीसेट',
      bandOf5: '5 सीटों की रेंज',
      allocatedSeatsSub: (seats, won2022) => `आवंटित: ${seats} सीटें · 2022 गठबंधन योग: ${won2022}`,
      showAllBands: 'सभी 81 रेंज (5-सीट अंतराल) में से चुनें',
      hideAllBands: 'सभी 81 सीट रेंज छिपाएं',
      overWarning: (total) =>
        `आवंटित (${total}) 403 सीटों से अधिक है। "403 संतुलित करें" दबाएं या रेंज कम करें।`,
      totalAllocatedPrefix: 'कुल गठबंधन सीटें:',
      saveCloud: 'Firebase में गठबंधन अनुमान सहेजें',
      savingCloud: 'सहेजा जा रहा है...',
      signInSave: 'सहेजने के लिए लॉगिन करें',
      perfTitle: (year) => `${year} गठबंधन व मोर्चा प्रदर्शन`,
      predict2027Btn: '2027 गठबंधन अनुमान लगाएं →',
      seatShare: (pct) => `गठबंधन हिस्सा: ${pct}%`,
      constituentsLabel: 'शामिल दल:',
      partySumHint: (n) => `पार्टी सीटों का योग: ${n}`,
    },
    constituencies: {
      title: '403 विधानसभा सीटें',
      subtitle: '2007–2022 परिणाम देखने और 2027 विजेता चुनने के लिए सीट पर टैप करें',
      predictedChip: (count) => `${count} / 403 चयनित`,
      searchPlaceholder: 'सीट नं. (1–403), नाम, जिला या उम्मीदवार खोजें...',
      allDistricts: 'सभी 75 जिले',
      allLabel: (n) => `सभी (${n})`,
      myPicksLabel: (n) => `मेरी पसंद (${n})`,
      pendingLabel: (n) => `शेष (${n})`,
      noMatches: 'कोई विधानसभा क्षेत्र नहीं मिला',
      noMatchesSub: 'खोज शब्द हटाएं या जिला फ़िल्टर बदलें।',
      predictBtn: 'चुनें',
      nextSeat: 'अगली सीट →',
      histSection: 'पिछले चुनाव परिणाम',
      winnerLabel: (yr) => `${yr} विजेता`,
      runnerUpLabel: (yr) => `${yr} उपविजेता`,
      votesSuffix: 'वोट',
      refTally: 'संदर्भ आंकड़ा',
      whoWillWin: 'आपके अनुसार इस सीट से कौन जीतेगा?',
      pickedLabel: 'चयनित:',
      selectedLabel: 'चयनित',
      selectLabel: 'चुनें',
      officialListAwaited: 'आधिकारिक उम्मीदवार सूची की प्रतीक्षा है।',
      officialListDesc:
        'घोषणा होते ही 2027 के अन्य उम्मीदवार यहाँ जुड़ जाएंगे। आप नीचे से संभावित विजेता दल भी चुन सकते हैं:',
      customNamePlaceholder: 'वैकल्पिक उम्मीदवार का नाम...',
      savePickBtn: 'पसंद सहेजें',
    },
    leaderboard: {
      tabLeaderboard: 'लीडरबोर्ड',
      tabSummary: 'मेरा सारांश',
      openBoardTitle: 'UP Mandate शीर्ष पूर्वानुमानकर्ता',
      openBoardSub: '100% निःशुल्क प्रवेश · विजेताओं को ₹50 लाख के पुरस्कार व उपहार',
      scoringRulesBtn: 'अंक व पुरस्कार नियम',
      scoringTitle: 'पारदर्शी अंक पद्धति',
      ruleConstituency: 'सही विधानसभा विजेता (ECI परिणाम के बाद): 10 अंक प्रति सीट',
      rulePartyBand: 'सही पार्टी 5-सीट रेंज अनुमान: 100 अंक प्रति पार्टी',
      ruleCompletion: 'सभी 403 सीटें पूर्ण करने पर बोनस: 50 अंक',
      rulePreCount:
        'मतगणना से पहले के नागरिक अंक आपकी पूर्णता व पार्टी संतुलन को दर्शाते हैं।',
      rulePools:
        '100% निःशुल्क श्रेणी — सत्यापित ECI परिणाम के बाद शीर्ष विजेताओं को ₹50 लाख के पुरस्कार व उपहार मिलेंगे।',
      emptyOpenBoard:
        '₹50 लाख के पुरस्कार व उपहार जीतने के लिए मोबाइल OTP या Google से साइन इन करें और लीडरबोर्ड सक्रिय करें।',
      publicAliasActive: 'सार्वजनिक उपनाम सक्रिय',
      hiddenFromBoard: 'सार्वजनिक लीडरबोर्ड से छिपा हुआ (प्रोफ़ाइल सेटिंग्स)',
      footerNote:
        'सत्यापित ECI मतगणना परिणामों के बाद अंतिम अंक स्वचालित रूप से अपडेट होंगे। 100% निःशुल्क · ₹50 लाख पुरस्कार व उपहार।',
      constituencyProgress: 'विधानसभा प्रगति',
      seatsRemaining: (n) => `${n} सीटें शेष`,
      predictionCutoff: 'अंतिम समय-सीमा',
      countingDayLabel: 'सुबह 7:00 बजे IST मतगणना दिवस',
      cloudSyncStatus: 'क्लाउड सिंक स्थिति',
      submitted: 'सबमिट किया गया',
      draftSynced: 'ड्राफ्ट सिंक',
      partyForecast: 'पार्टी सीट पूर्वानुमान',
      editBands: 'रेंज बदलें',
      updateForecast: 'सबमिट पूर्वानुमान अपडेट करें',
      submitForecast: 'पूर्वानुमान की पुष्टि व सबमिट करें',
      yourPicksTitle: (n) => `आपकी चुनी हुई सीटें (${n})`,
      editableUntil: 'मतगणना तिथि को सुबह 7:00 बजे तक संपादन योग्य',
      pickMoreSeats: 'और सीटें चुनें →',
      filterPicksPlaceholder: 'सीट नं., नाम, उम्मीदवार या पार्टी से खोजें...',
      noPicksTitle: 'अभी कोई विधानसभा पूर्वानुमान सहेजा नहीं गया है',
      noPicksSub: 'उत्तर प्रदेश की 403 सीटों में विजेता चुनने के लिए विधानसभा क्षेत्र टैब खोलें।',
    },
  },
};
