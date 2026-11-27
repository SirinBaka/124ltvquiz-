export type ScientificCategory = 'chemistry' | 'math' | 'physics' | 'greek';

export type SymbolItem = {
  id: string;
  label: string;
  snippet: string;
  displayTex: string;
  tooltip?: string;
  isPopular?: boolean;
};

export type CategorySection = {
  id: string;
  title: string;
  description?: string;
  items: SymbolItem[];
};

export const QUICK_SYMBOLS: SymbolItem[] = [
  { id: 'q_frac', label: 'Phân số', snippet: '$\\frac{|a}{b}$', displayTex: '\\frac{a}{b}', tooltip: 'Phân số a/b', isPopular: true },
  { id: 'q_sup', label: 'Số mũ', snippet: '^{|2}', displayTex: 'x^2', tooltip: 'Số mũ lũy thừa', isPopular: true },
  { id: 'q_sub', label: 'Chỉ số dưới', snippet: '_{|1}', displayTex: 'x_1', tooltip: 'Chỉ số dưới', isPopular: true },
  { id: 'q_sqrt', label: 'Căn bậc 2', snippet: '$\\sqrt{|x}$', displayTex: '\\sqrt{x}', tooltip: 'Căn bậc hai', isPopular: true },
  { id: 'q_arrow', label: 'Mũi tên phản ứng', snippet: '$\\ce{->}$', displayTex: '\\rightarrow', tooltip: 'Mũi tên phản ứng 1 chiều', isPopular: true },
  { id: 'q_cat_t', label: 'Xúc tác nhiệt độ', snippet: '$\\ce{->[t^\\circ]}$', displayTex: '\\xrightarrow{t^\\circ}', tooltip: 'Phản ứng có nhiệt độ t°', isPopular: true },
  { id: 'q_cat_full', label: 'Nhiệt độ + Xúc tác', snippet: '$\\ce{->[t^\\circ][xt]}$', displayTex: '\\xrightarrow[\\text{xt}]{t^\\circ}', tooltip: 'Nhiệt độ t° và chất xúc tác xt', isPopular: true },
  { id: 'q_rev', label: 'Thuận nghịch', snippet: '$\\ce{<=>}$', displayTex: '\\rightleftharpoons', tooltip: 'Phản ứng 2 chiều thuận nghịch', isPopular: true },
  { id: 'q_precipitate', label: 'Kết tủa ↓', snippet: '$\\downarrow$', displayTex: '\\downarrow', tooltip: 'Chất kết tủa', isPopular: true },
  { id: 'q_gas', label: 'Khí bay lên ↑', snippet: '$\\uparrow$', displayTex: '\\uparrow', tooltip: 'Chất khí bay hơi', isPopular: true },
  { id: 'q_deg_c', label: 'Độ C', snippet: '$^\\circ\\text{C}$', displayTex: '^\\circ\\text{C}', tooltip: 'Độ Celsius', isPopular: true },
  { id: 'q_vec', label: 'Vector', snippet: '$\\vec{|v}$', displayTex: '\\vec{v}', tooltip: 'Đại lượng vector', isPopular: true },
  { id: 'q_angle', label: 'Góc', snippet: '$\\widehat{|ABC}$', displayTex: '\\widehat{ABC}', tooltip: 'Góc hình học', isPopular: true },
  { id: 'q_int', label: 'Tích phân', snippet: '$\\int_{|a}^{b} f(x)\\,dx$', displayTex: '\\int_a^b', tooltip: 'Tích phân xác định', isPopular: true },
  { id: 'q_pi', label: 'Số Pi', snippet: '$\\pi$', displayTex: '\\pi', tooltip: 'Hằng số Pi (3.1415...)', isPopular: true },
  { id: 'q_infty', label: 'Vô cực', snippet: '$\\infty$', displayTex: '\\infty', tooltip: 'Vô cực', isPopular: true },
];

export const CHEMISTRY_SECTIONS: CategorySection[] = [
  {
    id: 'chem_arrows',
    title: 'Mũi tên phản ứng & Xúc tác',
    description: 'Các loại mũi tên phản ứng 1 chiều, 2 chiều thuận nghịch, kèm nhiệt độ, xúc tác, áp suất',
    items: [
      { id: 'ch_arrow_1', label: 'Phản ứng 1 chiều', snippet: '$\\ce{->}$', displayTex: '\\rightarrow', tooltip: 'Mũi tên phản ứng' },
      { id: 'ch_arrow_rev', label: 'Thuận nghịch', snippet: '$\\ce{<=>}$', displayTex: '\\rightleftharpoons', tooltip: 'Cân bằng hóa học 2 chiều' },
      { id: 'ch_arrow_t', label: 'Nhiệt độ (t°)', snippet: '$\\ce{->[t^\\circ]}$', displayTex: '\\xrightarrow{t^\\circ}', tooltip: 'Nhiệt độ phản ứng' },
      { id: 'ch_arrow_xt', label: 'Xúc tác (xt)', snippet: '$\\ce{->[][xt]}$', displayTex: '\\xrightarrow[\\text{xt}]{}', tooltip: 'Chất xúc tác phản ứng' },
      { id: 'ch_arrow_txt', label: 'Nhiệt độ & Xúc tác', snippet: '$\\ce{->[t^\\circ][xt]}$', displayTex: '\\xrightarrow[\\text{xt}]{t^\\circ}', tooltip: 'Nhiệt độ t° và xúc tác xt' },
      { id: 'ch_arrow_tp', label: 'Nhiệt độ & Áp suất (p)', snippet: '$\\ce{->[t^\\circ][p]}$', displayTex: '\\xrightarrow[p]{t^\\circ}', tooltip: 'Nhiệt độ t° và áp suất p' },
      { id: 'ch_arrow_acid', label: 'Axit H2SO4, t°', snippet: '$\\ce{->[H2SO4, t^\\circ]}$', displayTex: '\\xrightarrow[\\text{t}^\\circ]{\\text{H}_2\\text{SO}_4}', tooltip: 'Xúc tác H2SO4 đặc và nhiệt độ' },
      { id: 'ch_arrow_light', label: 'Ánh sáng (as)', snippet: '$\\ce{->[as]}$', displayTex: '\\xrightarrow{\\text{as}}', tooltip: 'Ánh sáng khuếch tán' },
      { id: 'ch_arrow_photosyn', label: 'Quang hợp (as, diệp lục)', snippet: '$\\ce{->[as][clorophin]}$', displayTex: '\\xrightarrow[\\text{diệp lục}]{\\text{as}}', tooltip: 'Quang hợp' },
      { id: 'ch_arrow_enzyme', label: 'Men giấm / Men rượu', snippet: '$\\ce{->[men]}$', displayTex: '\\xrightarrow{\\text{men}}', tooltip: 'Lên men vi sinh' },
      { id: 'ch_arrow_rev_txt', label: 'Thuận nghịch có t°, xt', snippet: '$\\ce{<=>[t^\\circ][xt]}$', displayTex: '\\xrightleftharpoons[\\text{xt}]{t^\\circ}', tooltip: 'Cân bằng có điều kiện' },
      { id: 'ch_arrow_electrolysis', label: 'Điện phân dd', snippet: '$\\ce{->[\\text{đpdd}][\\text{màng ngăn}]}$', displayTex: '\\xrightarrow[\\text{màng ngăn}]{\\text{đpdd}}', tooltip: 'Điện phân dung dịch' },
    ]
  },
  {
    id: 'chem_states',
    title: 'Hiện tượng & Trạng thái',
    description: 'Ký hiệu kết tủa, khí bay hơi, dạng chất rắn, lỏng, khí, dung dịch',
    items: [
      { id: 'ch_down', label: 'Kết tủa ↓', snippet: '$\\downarrow$', displayTex: '\\downarrow', tooltip: 'Kết tủa xuống' },
      { id: 'ch_up', label: 'Bay hơi ↑', snippet: '$\\uparrow$', displayTex: '\\uparrow', tooltip: 'Khí thoát ra' },
      { id: 'ch_solid', label: 'Rắn (r)', snippet: '(r)', displayTex: '(r)', tooltip: 'Chất rắn' },
      { id: 'ch_liquid', label: 'Lỏng (l)', snippet: '(l)', displayTex: '(l)', tooltip: 'Chất lỏng' },
      { id: 'ch_gas', label: 'Khí (k)', snippet: '(k)', displayTex: '(k)', tooltip: 'Chất khí' },
      { id: 'ch_aqueous', label: 'Dung dịch (dd)', snippet: '(dd)', displayTex: '(dd)', tooltip: 'Dung dịch' },
    ]
  },
  {
    id: 'chem_ions',
    title: 'Ion & Điện tích',
    description: 'Các ion kim loại, phi kim, gốc axit và nhóm bazo phổ biến',
    items: [
      { id: 'ion_h', label: 'H+', snippet: '$\\ce{H+}$', displayTex: '\\text{H}^+', tooltip: 'Cation Hydrogen' },
      { id: 'ion_oh', label: 'OH-', snippet: '$\\ce{OH-}$', displayTex: '\\text{OH}^-', tooltip: 'Anion Hydroxide' },
      { id: 'ion_fe2', label: 'Fe2+', snippet: '$\\ce{Fe^{2+}}$', displayTex: '\\text{Fe}^{2+}', tooltip: 'Sắt (II)' },
      { id: 'ion_fe3', label: 'Fe3+', snippet: '$\\ce{Fe^{3+}}$', displayTex: '\\text{Fe}^{3+}', tooltip: 'Sắt (III)' },
      { id: 'ion_cu2', label: 'Cu2+', snippet: '$\\ce{Cu^{2+}}$', displayTex: '\\text{Cu}^{2+}', tooltip: 'Đồng (II)' },
      { id: 'ion_al3', label: 'Al3+', snippet: '$\\ce{Al^{3+}}$', displayTex: '\\text{Al}^{3+}', tooltip: 'Nhôm (III)' },
      { id: 'ion_ba2', label: 'Ba2+', snippet: '$\\ce{Ba^{2+}}$', displayTex: '\\text{Ba}^{2+}', tooltip: 'Bari (II)' },
      { id: 'ion_cl', label: 'Cl-', snippet: '$\\ce{Cl-}$', displayTex: '\\text{Cl}^-', tooltip: 'Chloride' },
      { id: 'ion_so4', label: 'SO4 2-', snippet: '$\\ce{SO4^{2-}}$', displayTex: '\\text{SO}_4^{2-}', tooltip: 'Sulfate' },
      { id: 'ion_no3', label: 'NO3 -', snippet: '$\\ce{NO3-}$', displayTex: '\\text{NO}_3^-', tooltip: 'Nitrate' },
      { id: 'ion_co3', label: 'CO3 2-', snippet: '$\\ce{CO3^{2-}}$', displayTex: '\\text{CO}_3^{2-}', tooltip: 'Carbonate' },
      { id: 'ion_nh4', label: 'NH4 +', snippet: '$\\ce{NH4+}$', displayTex: '\\text{NH}_4^+', tooltip: 'Amoni' },
    ]
  },
  {
    id: 'chem_templates',
    title: 'Phương trình hóa học mẫu',
    description: 'Các phản ứng hóa học thông dụng có xúc tác, nhiệt độ, kết tủa và khí bay hơi',
    items: [
      { id: 'eq_water', label: 'Oxy hóa Hydro', snippet: '$\\ce{2H2 + O2 ->[t^\\circ] 2H2O}$', displayTex: '\\ce{2H2 + O2 ->[t^\\circ] 2H2O}', tooltip: 'Cháy hydro có t°' },
      { id: 'eq_fe_hcl', label: 'Fe + HCl (Tạo khí)', snippet: '$\\ce{Fe + 2HCl -> FeCl2 + H2 ^}$', displayTex: '\\ce{Fe + 2HCl -> FeCl2 + H2 ^}', tooltip: 'Kim loại tác dụng axit' },
      { id: 'eq_ba_so4', label: 'Kết tủa BaSO4', snippet: '$\\ce{BaCl2 + H2SO4 -> BaSO4 v + 2HCl}$', displayTex: '\\ce{BaCl2 + H2SO4 -> BaSO4 v + 2HCl}', tooltip: 'Tạo kết tủa trắng BaSO4' },
      { id: 'eq_kmno4', label: 'Nhiệt phân KMnO4', snippet: '$\\ce{2KMnO4 ->[t^\\circ] K2MnO4 + MnO2 + O2 ^}$', displayTex: '\\ce{2KMnO4 ->[t^\\circ] K2MnO4 + MnO2 + O2 ^}', tooltip: 'Điều chế oxy phòng thí nghiệm' },
      { id: 'eq_nh3', label: 'Tổng hợp NH3 (Haber)', snippet: '$\\ce{N2 + 3H2 <=>[t^\\circ, p][Fe] 2NH3}$', displayTex: '\\ce{N2 + 3H2 <=>[t^\\circ, p][Fe] 2NH3}', tooltip: 'Xúc tác Fe, nhiệt độ t°, áp suất p' },
      { id: 'eq_ester', label: 'Phản ứng Este hóa', snippet: '$\\ce{CH3COOH + C2H5OH <=>[H2SO4, t^\\circ] CH3COOC2H5 + H2O}$', displayTex: '\\ce{CH3COOH + C2H5OH <=> CH3COOC2H5 + H2O}', tooltip: 'Xúc tác H2SO4 đặc và t°' },
      { id: 'eq_ferment', label: 'Lên men Rượu', snippet: '$\\ce{C6H12O6 ->[men] 2C2H5OH + 2CO2 ^}$', displayTex: '\\ce{C6H12O6 ->[men] 2C2H5OH + 2CO2 ^}', tooltip: 'Lên men glucozo ra cồn và khí CO2' },
      { id: 'eq_photosynthesis', label: 'Quang hợp', snippet: '$\\ce{6CO2 + 6H2O ->[\\text{as}][\\text{diệp lục}] C6H12O6 + 6O2 ^}$', displayTex: '\\ce{6CO2 + 6H2O -> C6H12O6 + 6O2 ^}', tooltip: 'Quang hợp cây xanh' },
    ]
  }
];

export const MATH_SECTIONS: CategorySection[] = [
  {
    id: 'math_algebra',
    title: 'Đại số & Lũy thừa',
    description: 'Phân số, căn thức, số mũ, chỉ số dưới, trị tuyệt đối',
    items: [
      { id: 'm_frac', label: 'Phân số', snippet: '$\\frac{|a}{b}$', displayTex: '\\frac{a}{b}', tooltip: 'Phân số a/b' },
      { id: 'm_sqrt', label: 'Căn bậc 2', snippet: '$\\sqrt{|x}$', displayTex: '\\sqrt{x}', tooltip: 'Căn bậc 2' },
      { id: 'm_sqrt_n', label: 'Căn bậc n', snippet: '$\\sqrt[n]{|x}$', displayTex: '\\sqrt[n]{x}', tooltip: 'Căn bậc n' },
      { id: 'm_pow', label: 'Số mũ', snippet: '^{|n}', displayTex: 'x^n', tooltip: 'Lũy thừa' },
      { id: 'm_sub', label: 'Chỉ số dưới', snippet: '_{|i}', displayTex: 'x_i', tooltip: 'Chỉ số dưới' },
      { id: 'm_abs', label: 'Trị tuyệt đối', snippet: '$||x||$', displayTex: '|x|', tooltip: 'Giá trị tuyệt đối' },
      { id: 'm_pm', label: 'Cộng trừ (±)', snippet: '$\\pm$', displayTex: '\\pm', tooltip: 'Cộng hoặc trừ' },
      { id: 'm_approx', label: 'Xấp xỉ (≈)', snippet: '$\\approx$', displayTex: '\\approx', tooltip: 'Gần bằng' },
      { id: 'm_neq', label: 'Khác (≠)', snippet: '$\\neq$', displayTex: '\\neq', tooltip: 'Khác nhau' },
      { id: 'm_le', label: 'Nhỏ hơn hoặc bằng (≤)', snippet: '$\\le$', displayTex: '\\le', tooltip: 'Nhỏ hơn hoặc bằng' },
      { id: 'm_ge', label: 'Lớn hơn hoặc bằng (≥)', snippet: '$\\ge$', displayTex: '\\ge', tooltip: 'Lớn hơn hoặc bằng' },
      { id: 'm_infty', label: 'Vô cực (∞)', snippet: '$\\infty$', displayTex: '\\infty', tooltip: 'Vô cùng lớn' },
    ]
  },
  {
    id: 'math_calculus',
    title: 'Giải tích & Giới hạn',
    description: 'Tích phân, đạo hàm, giới hạn, tổng xích-ma, tích quy nạp',
    items: [
      { id: 'm_int_def', label: 'Tích phân xác định', snippet: '$\\int_{|a}^{b} f(x)\\,dx$', displayTex: '\\int_a^b f(x)dx', tooltip: 'Tích phân từ a đến b' },
      { id: 'm_int_indef', label: 'Tích phân bất định', snippet: '$\\int |f(x)\\,dx$', displayTex: '\\int f(x)dx', tooltip: 'Nguyên hàm' },
      { id: 'm_iint', label: 'Tích phân kép', snippet: '$\\iint_D f(x,y)\\,dxdy$', displayTex: '\\iint_D', tooltip: 'Tích phân hai lớp' },
      { id: 'm_diff', label: 'Đạo hàm df/dx', snippet: '$\\frac{df}{dx}$', displayTex: '\\frac{df}{dx}', tooltip: 'Vi phân / Đạo hàm' },
      { id: 'm_prime', label: 'Đạo hàm f\'(x)', snippet: '$f\'(x)$', displayTex: 'f\'(x)', tooltip: 'Đạo hàm bậc nhất' },
      { id: 'm_lim', label: 'Giới hạn Lim', snippet: '$\\lim_{x \\to |x_0} f(x)$', displayTex: '\\lim_{x \\to x_0}', tooltip: 'Giới hạn của hàm số' },
      { id: 'm_sum', label: 'Tổng xích-ma ∑', snippet: '$\\sum_{i=1}^{|n} x_i$', displayTex: '\\sum_{i=1}^n', tooltip: 'Tổng các số hạng' },
      { id: 'm_prod', label: 'Tích ∏', snippet: '$\\prod_{i=1}^{|n} x_i$', displayTex: '\\prod_{i=1}^n', tooltip: 'Tích các số hạng' },
    ]
  },
  {
    id: 'math_geometry',
    title: 'Hình học & Lượng giác',
    description: 'Góc, vector, tam giác, vuông góc, song song, hàm sin, cos, tan, cot',
    items: [
      { id: 'm_hat_angle', label: 'Góc ABC', snippet: '$\\widehat{|ABC}$', displayTex: '\\widehat{ABC}', tooltip: 'Ký hiệu góc nón' },
      { id: 'm_ang', label: 'Ký hiệu góc ∠', snippet: '$\\angle |A$', displayTex: '\\angle A', tooltip: 'Góc' },
      { id: 'm_triangle', label: 'Tam giác Δ', snippet: '$\\Delta |ABC$', displayTex: '\\Delta ABC', tooltip: 'Tam giác' },
      { id: 'm_perp', label: 'Vuông góc ⊥', snippet: '$\\perp$', displayTex: '\\perp', tooltip: 'Vuông góc' },
      { id: 'm_parallel', label: 'Song song ∥', snippet: '$\\parallel$', displayTex: '\\parallel', tooltip: 'Song song' },
      { id: 'm_vec', label: 'Vector v', snippet: '$\\vec{|v}$', displayTex: '\\vec{v}', tooltip: 'Vector vận tốc / lực' },
      { id: 'm_vec_ab', label: 'Vector AB', snippet: '$\\overrightarrow{|AB}$', displayTex: '\\overrightarrow{AB}', tooltip: 'Vector điểm đầu cuối' },
      { id: 'm_deg', label: 'Độ (°)', snippet: '$|^\\circ$', displayTex: '^\\circ', tooltip: 'Độ góc' },
      { id: 'm_sin', label: 'sin(x)', snippet: '$\\sin(|x)$', displayTex: '\\sin x', tooltip: 'Hàm sin' },
      { id: 'm_cos', label: 'cos(x)', snippet: '$\\cos(|x)$', displayTex: '\\cos x', tooltip: 'Hàm cosin' },
      { id: 'm_tan', label: 'tan(x)', snippet: '$\\tan(|x)$', displayTex: '\\tan x', tooltip: 'Hàm tang' },
      { id: 'm_cot', label: 'cot(x)', snippet: '$\\cot(|x)$', displayTex: '\\cot x', tooltip: 'Hàm cotang' },
      { id: 'm_pi_geom', label: 'Số Pi π', snippet: '$\\pi$', displayTex: '\\pi', tooltip: 'Hằng số Pi' },
    ]
  },
  {
    id: 'math_sets',
    title: 'Tập hợp & Ký hiệu Logic',
    description: 'Thuộc, tập con, giao, hợp, với mọi, tồn tại, suy ra, tương đương',
    items: [
      { id: 'm_in', label: 'Thuộc (∈)', snippet: '$\\in$', displayTex: '\\in', tooltip: 'Phần tử thuộc tập' },
      { id: 'm_notin', label: 'Không thuộc (∉)', snippet: '$\\notin$', displayTex: '\\notin', tooltip: 'Không thuộc' },
      { id: 'm_subset', label: 'Tập con (⊂)', snippet: '$\\subset$', displayTex: '\\subset', tooltip: 'Tập hợp con' },
      { id: 'm_cap', label: 'Giao (∩)', snippet: '$\\cap$', displayTex: '\\cap', tooltip: 'Giao hai tập' },
      { id: 'm_cup', label: 'Hợp (∪)', snippet: '$\\cup$', displayTex: '\\cup', tooltip: 'Hợp hai tập' },
      { id: 'm_empty', label: 'Tập rỗng (∅)', snippet: '$\\emptyset$', displayTex: '\\emptyset', tooltip: 'Tập hợp rỗng' },
      { id: 'm_forall', label: 'Với mọi (∀)', snippet: '$\\forall$', displayTex: '\\forall', tooltip: 'Với mọi' },
      { id: 'm_exists', label: 'Tồn tại (∃)', snippet: '$\\exists$', displayTex: '\\exists', tooltip: 'Tồn tại' },
      { id: 'm_implies', label: 'Suy ra (⇒)', snippet: '$\\Rightarrow$', displayTex: '\\Rightarrow', tooltip: 'Kéo theo' },
      { id: 'm_equiv', label: 'Tương đương (⇔)', snippet: '$\\Leftrightarrow$', displayTex: '\\Leftrightarrow', tooltip: 'Khi và chỉ khi' },
      { id: 'm_set_r', label: 'Tập R', snippet: '$\\mathbb{R}$', displayTex: '\\mathbb{R}', tooltip: 'Tập số thực' },
      { id: 'm_set_n', label: 'Tập N', snippet: '$\\mathbb{N}$', displayTex: '\\mathbb{N}', tooltip: 'Tập số tự nhiên' },
    ]
  }
];

export const PHYSICS_SECTIONS: CategorySection[] = [
  {
    id: 'phys_vectors',
    title: 'Đại lượng Vector & Ký hiệu cơ bản',
    description: 'Các đại lượng vật lý vector trong cơ học, điện từ học',
    items: [
      { id: 'p_force', label: 'Lực F', snippet: '$\\vec{F}$', displayTex: '\\vec{F}', tooltip: 'Lực tác dụng' },
      { id: 'p_vel', label: 'Vận tốc v', snippet: '$\\vec{v}$', displayTex: '\\vec{v}', tooltip: 'Vận tốc' },
      { id: 'p_acc', label: 'Gia tốc a', snippet: '$\\vec{a}$', displayTex: '\\vec{a}', tooltip: 'Gia tốc' },
      { id: 'p_grav', label: 'Gia tốc g', snippet: '$\\vec{g}$', displayTex: '\\vec{g}', tooltip: 'Gia tốc trọng trường' },
      { id: 'p_elec', label: 'Điện trường E', snippet: '$\\vec{E}$', displayTex: '\\vec{E}', tooltip: 'Cường độ điện trường' },
      { id: 'p_mag', label: 'Từ trường B', snippet: '$\\vec{B}$', displayTex: '\\vec{B}', tooltip: 'Cảm ứng từ' },
      { id: 'p_mom', label: 'Động lượng p', snippet: '$\\vec{p}$', displayTex: '\\vec{p}', tooltip: 'Động lượng' },
      { id: 'p_normal', label: 'Phản lực N', snippet: '$\\vec{N}$', displayTex: '\\vec{N}', tooltip: 'Áp lực / Phản lực' },
    ]
  },
  {
    id: 'phys_units',
    title: 'Đơn vị đo & Đại lượng Vật lý',
    description: 'Các đơn vị chuẩn SI trong Vật lý kèm ký hiệu khoa học',
    items: [
      { id: 'u_deg_c', label: 'Độ C (°C)', snippet: '$^\\circ\\text{C}$', displayTex: '^\\circ\\text{C}', tooltip: 'Nhiệt độ Celsius' },
      { id: 'u_kelvin', label: 'Kelvin (K)', snippet: '$\\text{K}$', displayTex: '\\text{K}', tooltip: 'Nhiệt độ tuyệt đối' },
      { id: 'u_speed', label: 'm/s', snippet: '$\\text{m/s}$', displayTex: '\\text{m/s}', tooltip: 'Mét trên giây' },
      { id: 'u_acc', label: 'm/s²', snippet: '$\\text{m/s}^2$', displayTex: '\\text{m/s}^2', tooltip: 'Gia tốc' },
      { id: 'u_kmh', label: 'km/h', snippet: '$\\text{km/h}$', displayTex: '\\text{km/h}', tooltip: 'Kilômét trên giờ' },
      { id: 'u_newton', label: 'Newton (N)', snippet: '$\\text{N}$', displayTex: '\\text{N}', tooltip: 'Lực' },
      { id: 'u_joule', label: 'Joule (J)', snippet: '$\\text{J}$', displayTex: '\\text{J}', tooltip: 'Công / Năng lượng' },
      { id: 'u_watt', label: 'Watt (W)', snippet: '$\\text{W}$', displayTex: '\\text{W}', tooltip: 'Công suất' },
      { id: 'u_kwh', label: 'kWh', snippet: '$\\text{kWh}$', displayTex: '\\text{kWh}', tooltip: 'Điện năng tiêu thụ' },
      { id: 'u_ohm', label: 'Ôm (Ω)', snippet: '$\\Omega$', displayTex: '\\Omega', tooltip: 'Điện trở' },
      { id: 'u_volt', label: 'Volt (V)', snippet: '$\\text{V}$', displayTex: '\\text{V}', tooltip: 'Hiệu điện thế' },
      { id: 'u_ampere', label: 'Ampe (A)', snippet: '$\\text{A}$', displayTex: '\\text{A}', tooltip: 'Cường độ dòng điện' },
      { id: 'u_hz', label: 'Hertz (Hz)', snippet: '$\\text{Hz}$', displayTex: '\\text{Hz}', tooltip: 'Tần số' },
      { id: 'u_microfarad', label: 'μF', snippet: '$\\mu\\text{F}$', displayTex: '\\mu\\text{F}', tooltip: 'Điện dung tụ điện' },
    ]
  },
  {
    id: 'phys_constants',
    title: 'Hằng số & Ký hiệu chuyên ngành',
    description: 'Bước sóng, tần số góc, điện trở suất, pha ban đầu, hệ số ma sát',
    items: [
      { id: 'c_lambda', label: 'Bước sóng (λ)', snippet: '$\\lambda$', displayTex: '\\lambda', tooltip: 'Bước sóng' },
      { id: 'c_omega', label: 'Tần số góc (ω)', snippet: '$\\omega$', displayTex: '\\omega', tooltip: 'Tần số góc / Tốc độ góc' },
      { id: 'c_delta_t', label: 'Khoảng t (Δt)', snippet: '$\\Delta t$', displayTex: '\\Delta t', tooltip: 'Độ biến thiên thời gian' },
      { id: 'c_rho', label: 'Khối lượng riêng (ρ)', snippet: '$\\rho$', displayTex: '\\rho', tooltip: 'Khối lượng riêng / Điện trở suất' },
      { id: 'c_phi', label: 'Pha ban đầu (φ)', snippet: '$\\varphi$', displayTex: '\\varphi', tooltip: 'Pha ban đầu' },
      { id: 'c_mu', label: 'Hệ số ma sát (μ)', snippet: '$\\mu$', displayTex: '\\mu', tooltip: 'Hệ số ma sát' },
      { id: 'c_alpha', label: 'Tia Alpha (α)', snippet: '$\\alpha$', displayTex: '\\alpha', tooltip: 'Tia phóng xạ alpha' },
      { id: 'c_beta', label: 'Tia Beta (β)', snippet: '$\\beta$', displayTex: '\\beta', tooltip: 'Tia phóng xạ beta' },
      { id: 'c_gamma', label: 'Tia Gamma (γ)', snippet: '$\\gamma$', displayTex: '\\gamma', tooltip: 'Tia phóng xạ gamma' },
    ]
  },
  {
    id: 'phys_templates',
    title: 'Công thức Vật lý kinh điển',
    description: 'Các hệ thức Vật lý THPT phổ biến',
    items: [
      { id: 'pf_kin', label: 'Vận tốc thẳng biến đổi', snippet: '$v = v_0 + at$', displayTex: 'v = v_0 + at', tooltip: 'Vận tốc biến đổi đều' },
      { id: 'pf_dist', label: 'Quãng đường s', snippet: '$s = v_0 t + \\frac{1}{2}at^2$', displayTex: 's = v_0 t + \\frac{1}{2}at^2', tooltip: 'Quãng đường đi được' },
      { id: 'pf_newton', label: 'Định luật II Newton', snippet: '$\\vec{F} = m\\vec{a}$', displayTex: '\\vec{F} = m\\vec{a}', tooltip: 'F = m.a' },
      { id: 'pf_ke', label: 'Động năng', snippet: '$W_{\\text{đ}} = \\frac{1}{2}mv^2$', displayTex: 'W_{\\text{đ}} = \\frac{1}{2}mv^2', tooltip: 'Động năng của vật' },
      { id: 'pf_ohm', label: 'Định luật Ôm', snippet: '$I = \\frac{U}{R}$', displayTex: 'I = \\frac{U}{R}', tooltip: 'Định luật Ôm cho đoạn mạch' },
      { id: 'pf_wave', label: 'Bước sóng', snippet: '$\\lambda = \\frac{v}{f}$', displayTex: '\\lambda = \\frac{v}{f}', tooltip: 'Hệ thức bước sóng' },
      { id: 'pf_pendulum', label: 'Chu kỳ con lắc đơn', snippet: '$T = 2\\pi\\sqrt{\\frac{l}{g}}$', displayTex: 'T = 2\\pi\\sqrt{\\frac{l}{g}}', tooltip: 'Chu kỳ dao động' },
      { id: 'pf_einstein', label: 'Năng lượng Anh-xtanh', snippet: '$E = mc^2$', displayTex: 'E = mc^2', tooltip: 'Hệ thức Anh-xtanh' },
    ]
  }
];

export const GREEK_SECTIONS: CategorySection[] = [
  {
    id: 'greek_letters',
    title: 'Bảng chữ cái Hy Lạp',
    description: 'Các ký tự Hy Lạp thường gặp trong Toán, Lý, Hóa',
    items: [
      { id: 'gr_alpha', label: 'alpha', snippet: '$\\alpha$', displayTex: '\\alpha' },
      { id: 'gr_beta', label: 'beta', snippet: '$\\beta$', displayTex: '\\beta' },
      { id: 'gr_gamma', label: 'gamma', snippet: '$\\gamma$', displayTex: '\\gamma' },
      { id: 'gr_delta', label: 'delta', snippet: '$\\delta$', displayTex: '\\delta' },
      { id: 'gr_Delta', label: 'Delta', snippet: '$\\Delta$', displayTex: '\\Delta' },
      { id: 'gr_epsilon', label: 'epsilon', snippet: '$\\varepsilon$', displayTex: '\\varepsilon' },
      { id: 'gr_theta', label: 'theta', snippet: '$\\theta$', displayTex: '\\theta' },
      { id: 'gr_lambda', label: 'lambda', snippet: '$\\lambda$', displayTex: '\\lambda' },
      { id: 'gr_mu', label: 'mu', snippet: '$\\mu$', displayTex: '\\mu' },
      { id: 'gr_pi', label: 'pi', snippet: '$\\pi$', displayTex: '\\pi' },
      { id: 'gr_rho', label: 'rho', snippet: '$\\rho$', displayTex: '\\rho' },
      { id: 'gr_sigma', label: 'sigma', snippet: '$\\sigma$', displayTex: '\\sigma' },
      { id: 'gr_tau', label: 'tau', snippet: '$\\tau$', displayTex: '\\tau' },
      { id: 'gr_phi', label: 'phi', snippet: '$\\varphi$', displayTex: '\\varphi' },
      { id: 'gr_omega', label: 'omega', snippet: '$\\omega$', displayTex: '\\omega' },
      { id: 'gr_Omega', label: 'Omega', snippet: '$\\Omega$', displayTex: '\\Omega' },
    ]
  }
];
