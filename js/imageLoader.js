import { CIRCLES, SPECIAL_CIRCLE_IMAGE } from './config.js';

export class ImageLoader {
    constructor() {
        this.images = {};
        this.loaded = false;
    }

    async preloadAll() {
        console.log('=== 이미지 프리로드 시작 ===');

        const imagePromises = [];

        // 모든 circle 이미지 로드
        CIRCLES.forEach((circle, index) => {
            const promise = this.loadImage(circle.image, `circle_${index}`);
            imagePromises.push(promise);
        });

        // special 이미지 로드
        imagePromises.push(this.loadImage(SPECIAL_CIRCLE_IMAGE, 'special'));

        try {
            await Promise.all(imagePromises);
            console.log('✅ 모든 이미지 로드 완료!');
            console.log('로드된 이미지:', Object.keys(this.images));
            this.loaded = true;
            return true;
        } catch (error) {
            console.error('❌ 이미지 로드 실패:', error);
            return false;
        }
    }

    loadImage(src, key) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                this.images[key] = img;
                console.log(`✅ 로드 성공: ${key} (${src})`);
                resolve(img);
            };

            img.onerror = (e) => {
                console.error(`❌ 로드 실패: ${key} (${src})`);
                reject(new Error(`Failed to load ${src}`));
            };

            img.src = src;
        });
    }

    getImage(key) {
        return this.images[key];
    }

    // ← 🆕 추가: 모든 이미지 반환
    getAllImages() {
        return this.images;
    }
}