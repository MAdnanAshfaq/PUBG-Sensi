import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback } from '@/utils/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, score } = body;

    if (!slug || !score) {
      return NextResponse.json(
        { success: false, error: 'Slug and score are required fields' },
        { status: 400 }
      );
    }

    const saved = await saveFeedback(slug, score);
    if (saved) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save feedback' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in feedback API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
