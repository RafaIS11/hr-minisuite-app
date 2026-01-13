import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Webhook logic for n8n integration
        // Here you would typically trigger an n8n workflow or process incoming data
        console.log('Received n8n webhook:', body);

        return NextResponse.json({
            success: true,
            message: 'Webhook received and processed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Error processing webhook'
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'n8n Webhook endpoint active. Use POST to send data.'
    });
}
