export interface Region {
  id: string
  name: string
  lat: number
  lng: number
}

export const MAJOR_REGIONS: Region[] = [
  { id: 'gangnam',    name: '강남·역삼',    lat: 37.4979, lng: 127.0276 },
  { id: 'hongdae',   name: '홍대·합정',    lat: 37.5563, lng: 126.9235 },
  { id: 'jongno',    name: '종로·인사동',  lat: 37.5735, lng: 126.9790 },
  { id: 'myeongdong',name: '명동·시청',    lat: 37.5636, lng: 126.9820 },
  { id: 'sinchon',   name: '신촌·이대',    lat: 37.5595, lng: 126.9368 },
  { id: 'itaewon',   name: '이태원·한남',  lat: 37.5344, lng: 126.9994 },
  { id: 'konkuk',    name: '건대·성수',    lat: 37.5403, lng: 127.0693 },
  { id: 'jamsil',    name: '잠실·송파',    lat: 37.5133, lng: 127.1028 },
  { id: 'wangsimni', name: '왕십리·행당',  lat: 37.5613, lng: 127.0375 },
  { id: 'yeouido',   name: '여의도',       lat: 37.5214, lng: 126.9246 },
  { id: 'mapo',      name: '마포·공덕',    lat: 37.5479, lng: 126.9519 },
  { id: 'pangyo',    name: '판교·분당',    lat: 37.3952, lng: 127.1104 },
  { id: 'suwon',     name: '수원·영통',    lat: 37.2636, lng: 127.0286 },
  { id: 'incheon',   name: '인천·부평',    lat: 37.4872, lng: 126.7235 },
  { id: 'ilsan',     name: '일산·킨텍스',  lat: 37.6583, lng: 126.8320 },
]
