import type { DatedClassEvent, LiveClassStatus } from './tluSchedule';

export type CompanionPersonality = 'sweet' | 'bestie';
export type CompanionMood = 'cheer' | 'study' | 'chill';

export interface CompanionPreferences {
  nickname: string;
  companionName: string;
  personality: CompanionPersonality;
  showStickers: boolean;
  heartsCount: number;
}

export const DEFAULT_COMPANION_PREFS: CompanionPreferences = {
  nickname: 'bạn',
  companionName: 'Elysia',
  personality: 'sweet',
  showStickers: true,
  heartsCount: 0,
};

export interface CompanionSpeech {
  mood: CompanionMood;
  text: string;
  tag: string;
}

export interface CompanionContextInput {
  todayEvents: DatedClassEvent[];
  liveStatus: LiveClassStatus;
  nowMinutes: number;
  prefs: CompanionPreferences;
}

export const CHIBI_ASSETS: Record<CompanionMood, string> = {
  cheer: '/src/assets/images/chibi_sticker_cheer_1795442277196.jpg',
  study: '/src/assets/images/chibi_sticker_study_1795442275472.jpg',
  chill: '/src/assets/images/chibi_sticker_chill_1795442274156.jpg',
};

export const HEADER_BUST_ASSET =
  '/src/assets/images/companion_header_bust_1795442277866.jpg';

export const POLAROID_SCENE_ASSET =
  '/src/assets/images/polaroid_scene_crystal_1795442276270.jpg';

function callUser(nickname: string): string {
  const clean = nickname.trim();
  return clean || 'bạn';
}

function capitalizeSentence(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLocaleUpperCase('vi-VN') + text.slice(1);
}

/**
 * Generates an offline, zero-API contextual message reacting to the student's
 * real downloaded TLU schedule, time of day, and chosen personality.
 */
export function buildCompanionContextMessage(
  input: CompanionContextInput,
): CompanionSpeech {
  const { todayEvents, liveStatus, nowMinutes, prefs } = input;
  const user = callUser(prefs.nickname);
  const isBestie = prefs.personality === 'bestie';

  // 1. Currently in class
  if (liveStatus.current) {
    const mins = liveStatus.minutesRemaining ?? 0;
    return {
      mood: 'study',
      tag: 'Đang trong ca học',
      text: capitalizeSentence(
        isBestie
          ? `${user} ơi tập trung nghe giảng môn ${liveStatus.current.name} đi kìa, còn ${mins} phút nữa là được thả về rùi!`
          : `Cố lên ${user} nha! Môn ${liveStatus.current.name} ở phòng ${liveStatus.current.room} còn ${mins} phút nữa là xong rồi đó!`,
      ),
    };
  }

  // 2. Class starting soon (within 75 minutes)
  if (
    liveStatus.nextToday &&
    liveStatus.minutesUntilNext != null &&
    liveStatus.minutesUntilNext <= 75
  ) {
    const mins = liveStatus.minutesUntilNext;
    return {
      mood: 'study',
      tag: 'Sắp vào lớp',
      text: capitalizeSentence(
        isBestie
          ? `Ê ${user} ơi, còn ${mins} phút nữa vào ${liveStatus.nextToday.name} phòng ${liveStatus.nextToday.room} kìa! Xách cặp chạy lẹ không thầy điểm danh!`
          : `${user} ơi, còn ${mins} phút nữa tới môn ${liveStatus.nextToday.name} ở phòng ${liveStatus.nextToday.room} rồi, nhớ kiểm tra vở bút nha!`,
      ),
    };
  }

  // 3. Late night reminder (>= 22:30)
  if (nowMinutes >= 22 * 60 + 30 || nowMinutes < 5 * 60) {
    return {
      mood: 'chill',
      tag: 'Khuya rồi nè',
      text: isBestie
        ? `Khuya lắc khuya lơ rồi ${user} còn lướt lịch chi nữa, đi ngủ lẹ mai còn có sức dậy đi học TLU nha!`
        : `Trễ rồi đó ${user} ơi, ngủ sớm giữ sức khỏe để ngày mai đi học thật tươi tỉnh nha!`,
    };
  }

  // 4. Free day (no classes today)
  if (todayEvents.length === 0) {
    return {
      mood: 'chill',
      tag: 'Ngày trống lịch',
      text: isBestie
        ? `Hôm nay trống lịch hoàn toàn luôn ${user} ơi! Ngủ nướng, uống trà sữa dâu hay cày deadline nhẹ nhàng thui!`
        : `Hôm nay ${user} không có ca học nào nè! Tranh thủ nghỉ ngơi, thư giãn và nạp lại năng lượng nha!`,
    };
  }

  // 5. Heavy day (>= 3 classes)
  if (todayEvents.length >= 3) {
    return {
      mood: 'study',
      tag: `Lịch dày ${todayEvents.length} ca`,
      text: isBestie
        ? `Trời ơi hôm nay ${todayEvents.length} ca luôn hả ${user}?! Nhớ mang chai nước với ăn trưa đầy đủ kẻo xỉu trên giảng đường nha!`
        : `Hôm nay có tới ${todayEvents.length} buổi học lận, ${user} nhớ mang nước uống và ăn nhẹ giữa giờ để giữ sức nha!`,
    };
  }

  // 6. Early morning before 08:30 with classes today
  if (nowMinutes < 8 * 60 + 30 && liveStatus.nextToday) {
    return {
      mood: 'cheer',
      tag: 'Chào buổi sáng',
      text: isBestie
        ? `Chào buổi sáng ${user}! Hôm nay có ${todayEvents.length} ca thui, mở bát bằng ${liveStatus.nextToday.name} phòng ${liveStatus.nextToday.room} nha!`
        : `Chào buổi sáng ${user}! Chúc một ngày đi học thật vui vẻ nhé — ca đầu là ${liveStatus.nextToday.name} tại phòng ${liveStatus.nextToday.room}.`,
    };
  }

  // 7. Standard day with remaining or completed classes
  if (liveStatus.nextToday) {
    return {
      mood: 'cheer',
      tag: 'Lịch hôm nay',
      text: isBestie
        ? `Hôm nay còn ca ${liveStatus.nextToday.name} lúc ${liveStatus.nextToday.startTime} ở phòng ${liveStatus.nextToday.room} nha ${user}, nhớ để ý giờ!`
        : `Hôm nay ${user} có ${todayEvents.length} ca học. Ca tiếp theo là ${liveStatus.nextToday.name} lúc ${liveStatus.nextToday.startTime} tại ${liveStatus.nextToday.room}.`,
    };
  }

  return {
    mood: 'chill',
    tag: 'Hoàn thành hôm nay',
    text: capitalizeSentence(
      isBestie
        ? `Xong hết ${todayEvents.length} ca hôm nay rồi ${user} đỉnh quá! Tự thưởng cho bản thân ly trà sữa ngay thôi!`
        : `${user} đã học xong hết các buổi hôm nay rồi nè! Nghỉ ngơi thật thoải mái nha!`,
    ),
  };
}

const SWEET_TAP_LINES: Array<{ mood: CompanionMood; build: (u: string) => string }> = [
  {
    mood: 'cheer',
    build: (u) => `Chạm nhẹ vào mình đó hả ${u}? Chúc hôm nay của ${u} tràn đầy may mắn và điểm A+ nha!`,
  },
  {
    mood: 'study',
    build: (u) => `${u} nhớ mở app xem phòng học trước khi ra khỏi nhà nhé, không có Wi-Fi mình vẫn nhắc được luôn!`,
  },
  {
    mood: 'chill',
    build: (u) => `Học xong nhớ tự thưởng một ly trà sữa dâu ngọt lịm nha ${u}!`,
  },
  {
    mood: 'cheer',
    build: (u) => `Cố gắng từng buổi một rồi học kỳ này sẽ qua êm ru thôi, mình luôn cổ vũ ${u}!`,
  },
  {
    mood: 'study',
    build: (u) => `Mẹo nhỏ nè: chạm vào từng môn học là ${u} ghi chú bài tập ngoại tuyến ngay trong app được luôn đó!`,
  },
  {
    mood: 'chill',
    build: (u) => `Mệt quá thì hít thở sâu một cái rồi uống ngụm nước nha ${u}, đừng thức khuya quá đó!`,
  },
];

const BESTIE_TAP_LINES: Array<{ mood: CompanionMood; build: (u: string) => string }> = [
  {
    mood: 'cheer',
    build: (u) => `Chọc tui hoài vậy ${u}?! Học bài chưa hay lại đang tính trốn sang quán trà sữa đó!`,
  },
  {
    mood: 'study',
    build: (u) => `Nhớ kiểm tra đúng tòa A2, B5, C1, C5 nha ${u}, chạy nhầm nhà là leo cầu thang thở không ra hơi đâu!`,
  },
  {
    mood: 'chill',
    build: (u) => `Mất Wi-Fi giảng đường cũng không sao, lịch cả kỳ nằm gọn trong máy rồi, cứ chill thôi ${u}!`,
  },
  {
    mood: 'cheer',
    build: (u) => `GPA kỳ này nhất định phải tăng vèo vèo nha ${u}, tui chống mắt lên cổ vũ nè!`,
  },
  {
    mood: 'study',
    build: (u) => `Ê ${u}, có deadline nào quên ghi chú không? Bấm vô thẻ môn học note lại liền đi nha!`,
  },
  {
    mood: 'chill',
    build: (u) => `Căng thẳng quá thì nghỉ 5 phút nhìn tui cười một cái rồi chiến tiếp nha ${u}!`,
  },
];

export function getCompanionTapReaction(
  tapIndex: number,
  prefs: CompanionPreferences,
): CompanionSpeech {
  const user = callUser(prefs.nickname);
  const bank = prefs.personality === 'bestie' ? BESTIE_TAP_LINES : SWEET_TAP_LINES;
  const safeIdx = Math.abs(tapIndex) % bank.length;
  const entry = bank[safeIdx];
  return {
    mood: entry.mood,
    tag: prefs.personality === 'bestie' ? 'Bạn thân nhắc nhẹ' : 'Lời nhắn nhỏ',
    text: capitalizeSentence(entry.build(user)),
  };
}
