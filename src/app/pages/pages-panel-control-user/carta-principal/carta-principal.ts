import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { LayoutService } from '../../../core/services/layout.service';
import { ProductosService } from '../../../core/services/productos.service';
import { Category } from '../../../shared/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { SubCategory } from '../../../shared/models/subcategory.model';
import { SubCategoryService } from '../../../core/services/subcategory.service';
import { BusinessService } from '../../../core/services/business.service';
import { ProductResponse } from '../../../shared/models/product.model';

interface CategoryWithIcon extends Category {
  emoji: string;
}

interface CategoryWithCount extends CategoryWithIcon {
  count: number;
}

interface SubcategoryWithCount extends SubCategory {
  count: number;
}

interface ProductViewModel {
  id: number;
  name: string;
  description: string;
  truncatedDescription: string;
  formattedPrice: string;
  imageUrl: string;
  hasImage: boolean;
  allergenNames: string[];
  allergensText: string;
  raw: ProductResponse;
}

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  entrantes: '🍽️',
  principales: '🖖',
  'platos principales': '🖖',
  carnes: '🥩',
  pescados: '🐟',
  pescado: '🐟',
  mariscos: '🦞',
  bebidas: '🥤',
  refrescos: '🥤',
  vinos: '🍷',
  vino: '🍷',
  cervezas: '🍺',
  cerveza: '🍺',
  postres: '🰐',
  postre: '🰐',
  cafés: '☕',
  café: '☕',
  ensaladas: '🥗',
  ensalada: '🥗',
  pizzas: '🍕',
  pizza: '🍕',
  pastas: '🍝',
  pasta: '🍝',
  hamburguesas: '🍔',
  hamburguesa: '🍔',
  tapas: '🢢',
  raciones: '🍲',
  sopas: '🍜',
  sopa: '🍜',
  vegetariano: '🥬',
  vegano: '🌱',
  bocadillos: '🥖',
  bocadillo: '🥖',
  desayunos: '🥐',
  desayuno: '🥐'
};

const DEFAULT_CATEGORY_EMOJI = '🍴';
const SKELETON_FILTERS = [1, 2, 3, 4, 5];
const SKELETON_CARDS = [1, 2, 3, 4, 5, 6];

@Component({
  selector: 'app-carta-principal',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './carta-principal.html',
  styleUrls: ['./carta-principal.css']
})
export class CartaPrincipalComponent implements OnInit, OnDestroy {
  private readonly layoutService = inject(LayoutService);
  private readonly productosService = inject(ProductosService);
  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubCategoryService);
  private readonly businessService = inject(BusinessService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroy$ = new Subject<void>();

  readonly allProducts = signal<ProductResponse[]>([]);
  readonly categories = signal<CategoryWithIcon[]>([]);
  readonly subcategories = signal<SubCategory[]>([]);
  readonly businessName = signal('');

  readonly selectedCategoryId = signal<number | null>(null);
  readonly selectedSubcategoryId = signal<number | null>(null);
  readonly searchTerm = signal('');

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedProduct = signal<ProductViewModel | null>(null);
  readonly businessId = signal<number | null>(null);
  readonly isDarkMode = signal(false);
  readonly isHeaderHidden = signal(false);
  readonly showClearButton = signal(true);
  readonly isMenuOpen = signal(false);

  readonly skeletonFilters = SKELETON_FILTERS;
  readonly skeletonCards = SKELETON_CARDS;

  private lastScrollTop = 0;
  private readonly scrollThreshold = 10;
  private readonly footerDistanceThreshold = 150;

  readonly trimmedSearchTerm = computed(() => this.searchTerm().trim());

  readonly filteredProducts = computed(() => {
    let result = [...this.allProducts()];
    const search = this.trimmedSearchTerm();
    const selectedSubcategoryId = this.selectedSubcategoryId();
    const selectedCategoryId = this.selectedCategoryId();

    if (search) {
      result = this.productosService.searchProducts(result, search);
    }

    if (selectedSubcategoryId !== null) {
      return result.filter((product) => product.subCategoryId === selectedSubcategoryId);
    }

    if (selectedCategoryId !== null) {
      return result.filter((product) => product.categoryId === selectedCategoryId);
    }

    return result;
  });

  readonly categoryCountMap = computed(() => {
    const counts = new Map<number, number>();
    for (const product of this.allProducts()) {
      if (product.categoryId !== null && product.categoryId !== undefined) {
        counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
      }
    }
    return counts;
  });

  readonly subcategoryCountMap = computed(() => {
    const counts = new Map<number, number>();
    for (const product of this.allProducts()) {
      if (product.subCategoryId !== null && product.subCategoryId !== undefined) {
        counts.set(product.subCategoryId, (counts.get(product.subCategoryId) ?? 0) + 1);
      }
    }
    return counts;
  });

  readonly categoriesWithCount = computed<CategoryWithCount[]>(() => {
    const countMap = this.categoryCountMap();
    return this.categories().map((category) => ({
      ...category,
      count: countMap.get(category.id) ?? 0
    }));
  });

  readonly subcategoriesWithCount = computed<SubcategoryWithCount[]>(() => {
    const countMap = this.subcategoryCountMap();
    return this.subcategories().map((subcategory) => ({
      ...subcategory,
      count: countMap.get(subcategory.id) ?? 0
    }));
  });

  readonly productCards = computed<ProductViewModel[]>(() =>
    this.filteredProducts().map((product) => this.toProductViewModel(product))
  );

  readonly hasActiveFilters = computed(
    () =>
      this.selectedCategoryId() !== null ||
      this.selectedSubcategoryId() !== null ||
      this.trimmedSearchTerm() !== ''
  );

  readonly showSearchEmptyState = computed(
    () => this.productCards().length === 0 && this.trimmedSearchTerm() !== ''
  );

  readonly showCategoryEmptyState = computed(
    () =>
      this.productCards().length === 0 &&
      this.trimmedSearchTerm() === '' &&
      this.selectedCategoryId() !== null
  );

  readonly showGlobalEmptyState = computed(() => this.allProducts().length === 0);

  private readonly persistThemeEffect = effect(() => {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem('carta-theme', this.isDarkMode() ? 'dark' : 'light');
  });

  private readonly selectedCategoryEffect = effect(() => {
    const categoryId = this.selectedCategoryId();

    if (categoryId === null) {
      this.subcategories.set([]);
      return;
    }

    this.subcategoryService
      .getAllSubCategoriesByCategoryId(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subs) => this.subcategories.set(subs),
        error: () => this.subcategories.set([])
      });
  });

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.isMenuOpen()) {
      this.isHeaderHidden.set(false);
      return;
    }

    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (Math.abs(currentScrollTop - this.lastScrollTop) < this.scrollThreshold) {
      return;
    }

    if (currentScrollTop > this.lastScrollTop && currentScrollTop > 60) {
      this.isHeaderHidden.set(true);
    } else if (currentScrollTop < this.lastScrollTop) {
      this.isHeaderHidden.set(false);
    }

    this.lastScrollTop = currentScrollTop;

    const cartaWrapper = document.querySelector('.carta-wrapper');
    if (cartaWrapper) {
      const cartaRect = cartaWrapper.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const distanceToBottom = cartaRect.bottom - windowHeight;
      this.showClearButton.set(distanceToBottom > this.footerDistanceThreshold);
    }
  }

  ngOnInit(): void {
    this.layoutService.hideNavbar();
    this.loadBusinessId();
    this.loadThemePreference();

    if (this.businessId()) {
      this.loadAllData();
      this.loadBusinessName();
      return;
    }

    this.errorMessage.set('No se pudo cargar el negocio. Vuelve al panel de control.');
  }

  ngOnDestroy(): void {
    this.layoutService.showNavbarMethod();
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.isDarkMode.update((value) => !value);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  filterByCategory(categoryId: number): void {
    if (this.selectedCategoryId() === categoryId) {
      this.clearFilters();
      return;
    }

    this.selectedCategoryId.set(categoryId);
    this.selectedSubcategoryId.set(null);
    this.searchTerm.set('');
    this.scrollToProducts();
  }

  filterBySubcategory(subcategoryId: number): void {
    this.selectedSubcategoryId.set(subcategoryId);
    this.searchTerm.set('');
    this.scrollToProducts();
  }

  clearFilters(): void {
    this.selectedCategoryId.set(null);
    this.selectedSubcategoryId.set(null);
    this.subcategories.set([]);
    this.searchTerm.set('');
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.selectedCategoryId.set(null);
    this.selectedSubcategoryId.set(null);
    this.subcategories.set([]);
  }

  clearSearch(): void {
    this.onSearchInput('');
  }

  onProductClick(product: ProductViewModel): void {
    this.selectedProduct.set(product);
  }

  closeProductModal(): void {
    this.selectedProduct.set(null);
  }

  retryLoadData(): void {
    this.errorMessage.set(null);
    this.loadAllData();
  }

  private loadBusinessId(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const storedId = localStorage.getItem('currentBusinessId');
    this.businessId.set(storedId ? Number.parseInt(storedId, 10) : null);
  }

  private loadThemePreference(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedTheme = localStorage.getItem('carta-theme');
    this.isDarkMode.set(savedTheme === 'dark');
  }

  private loadBusinessName(): void {
    const currentBusinessId = this.businessId();
    if (!currentBusinessId) {
      return;
    }

    this.businessService.getBusinessById(currentBusinessId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (business) => this.businessName.set(business?.name || ''),
      error: () => this.businessName.set('')
    });
  }

  private loadAllData(): void {
    const currentBusinessId = this.businessId();
    if (!currentBusinessId) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      products: this.productosService.getProductsByBusinessId(currentBusinessId),
      categories: this.categoryService.getAllCategoriesByBusinessId(currentBusinessId)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ products, categories }) => {
          this.allProducts.set(this.productosService.getActiveProducts(products));
          this.categories.set(
            categories.map((category) => ({
              ...category,
              emoji: this.getCategoryEmoji(category.name)
            }))
          );
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ Error al cargar datos:', error);
          this.errorMessage.set('No se pudieron cargar los datos. Por favor, intente más tarde.');
          this.isLoading.set(false);
        }
      });
  }

  private getCategoryEmoji(categoryName: string): string {
    const normalized = categoryName.toLowerCase().trim();
    return CATEGORY_EMOJI_MAP[normalized] ?? DEFAULT_CATEGORY_EMOJI;
  }

  private toProductViewModel(product: ProductResponse): ProductViewModel {
    const imageUrl = product.image || '';
    const allergenNames = this.productosService.getAllergenNames(product);

    return {
      id: product.id,
      name: product.name,
      description: product.description || '',
      truncatedDescription: this.truncateText(product.description, 80),
      formattedPrice: this.productosService.formatPrice(product.price),
      imageUrl,
      hasImage: Boolean(imageUrl),
      allergenNames,
      allergensText: allergenNames.length > 0 ? allergenNames.join(', ') : 'Sin alérgenos declarados',
      raw: product
    };
  }

  private truncateText(text: string | undefined, limit: number): string {
    if (!text) {
      return '';
    }

    return text.length > limit ? `${text.substring(0, limit)}...` : text;
  }

  private scrollToProducts(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      const element = document.querySelector('.products-container');
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}